import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileUp, Sparkles, Download, AlertCircle, FileText, Image as ImageIcon, StopCircle, MessageSquarePlus, Presentation, FileArchive, Menu } from 'lucide-react';
import { PdfPage, ImageQuality, SessionMetadata } from './types';
import { extractImagesFromPdf, generatePdfFromImages } from './services/pdfService';
import { generatePptFromImages } from './services/pptService';
import { enhancePageImage } from './services/geminiService';
import { downloadAllAsZip } from './services/zipService';
import { saveSession, getSession, getAllSessionsMetadata, deleteSession, updateSessionName } from './services/storageService';
import ProcessingQueue from './components/ProcessingQueue';
import ApiKeySelector from './components/ApiKeySelector';
import SessionSidebar from './components/SessionSidebar';

const App: React.FC = () => {
  // Session State
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string>(''); // Explicit name state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // App State
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState<ImageQuality>('4K');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  // Ref to hold the AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Auto-save timer ref
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session list on mount
  useEffect(() => {
    loadSessionList();
  }, []);

  const loadSessionList = async () => {
    try {
      const list = await getAllSessionsMetadata();
      setSessions(list);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  // Auto-save logic
  useEffect(() => {
    // Only auto-save if we have a valid session ID and content
    if (!currentSessionId || pages.length === 0) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSaveSession();
    }, 2000); // Debounce 2s

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [pages, fileName, customPrompt, quality, currentSessionId, sessionName]);

  const handleSaveSession = async () => {
    if (!currentSessionId) return;

    // Use current sessionName, fallback to fileName, fallback to default
    const nameToSave = sessionName || fileName || '未命名会话';

    // We need to keep the original createdAt if it exists in the list, otherwise new
    const existingSession = sessions.find(s => s.id === currentSessionId);
    const createdAt = existingSession ? existingSession.createdAt : Date.now();

    const sessionData = {
      id: currentSessionId,
      name: nameToSave,
      createdAt: createdAt, 
      lastModified: Date.now(),
      pages,
      fileName,
      customPrompt,
      quality
    };

    try {
      await saveSession(sessionData);
      loadSessionList(); // Refresh list to update timestamps/names
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  };

  const handleNewSession = () => {
    if (isProcessing) return;
    setPages([]);
    setFileName('');
    setSessionName('');
    setCustomPrompt('');
    setError(null);
    setCurrentSessionId(crypto.randomUUID());
    // Don't save yet until user adds something
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleRenameSession = async (id: string, newName: string) => {
    try {
      await updateSessionName(id, newName);
      
      // If we are renaming the current session, update local state so auto-save uses new name
      if (id === currentSessionId) {
        setSessionName(newName);
      }
      
      loadSessionList();
    } catch (e) {
      console.error("Failed to rename session", e);
    }
  };

  const handleSelectSession = async (id: string) => {
    if (isProcessing) {
      if (!confirm("正在处理中，切换会话将停止当前任务。确定要切换吗？")) return;
      handleStopProcessing();
    }
    
    try {
      const session = await getSession(id);
      if (session) {
        setCurrentSessionId(session.id);
        setPages(session.pages);
        setFileName(session.fileName);
        setSessionName(session.name);
        setCustomPrompt(session.customPrompt);
        setQuality(session.quality);
        setError(null);
        setIsSidebarOpen(false); // Close sidebar on mobile
      }
    } catch (e) {
      console.error("Failed to load session", e);
      setError("加载会话失败");
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      if (currentSessionId === id) {
        handleNewSession();
      }
      loadSessionList();
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('请上传有效的 PDF 文件。');
      return;
    }

    // Determine if we should start a completely new session
    if (pages.length > 0) {
       // Old logic: just create new ID to avoid overwriting.
       setCurrentSessionId(crypto.randomUUID());
    } else if (!currentSessionId) {
       setCurrentSessionId(crypto.randomUUID());
    }

    setFileName(file.name);
    // Initialize session name with file name for new uploads
    setSessionName(file.name);
    setError(null);
    setPages([]); // Reset
    
    try {
      const extractedPages = await extractImagesFromPdf(file);
      setPages(extractedPages);
      // Trigger save immediately will happen via useEffect
    } catch (err) {
      console.error(err);
      setError('无法从 PDF 中提取图片。请尝试其他文件。');
    }
  };

  const handleUpdatePagePrompt = (pageNumber: number, prompt: string) => {
    setPages(prev => prev.map(p => 
      p.pageNumber === pageNumber ? { ...p, customPrompt: prompt } : p
    ));
  };

  const handleReplaceImage = (pageNumber: number, newImageBase64: string) => {
    setPages(prev => prev.map(p => 
      p.pageNumber === pageNumber 
        ? { ...p, originalImage: newImageBase64, processedImage: null, status: 'pending' as const } 
        : p
    ));
  };

  const handlePromoteImage = (pageNumber: number) => {
    setPages(prev => prev.map(p => {
      if (p.pageNumber === pageNumber && p.processedImage) {
        return { 
          ...p, 
          originalImage: p.processedImage, 
          processedImage: null, 
          status: 'pending' as const 
        };
      }
      return p;
    }));
  };

  const processPages = async () => {
    if (pages.length === 0 || (!isApiKeyReady && !keyError)) return;
    
    setIsProcessing(true);
    setError(null);
    setKeyError(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const updatedPages = [...pages];

    for (let i = 0; i < updatedPages.length; i++) {
      if (controller.signal.aborted) break;

      const page = updatedPages[i];
      if (page.status === 'completed') continue;

      updatedPages[i] = { ...page, status: 'processing' };
      setPages([...updatedPages]);

      const pagePrompt = page.customPrompt ? page.customPrompt.trim() : '';
      const combinedPrompt = [customPrompt.trim(), pagePrompt].filter(Boolean).join('\n\n[页面特定指令]:\n');

      try {
        const enhancedImage = await enhancePageImage(
          page.originalImage, 
          quality, 
          page.aspectRatio, 
          controller.signal,
          combinedPrompt
        );
        
        updatedPages[i] = { 
          ...page, 
          processedImage: enhancedImage, 
          status: 'completed' 
        };
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          updatedPages[i] = { ...page, status: 'pending' };
          setPages([...updatedPages]);
          break;
        }

        console.error(`Error processing page ${page.pageNumber}:`, err);
        updatedPages[i] = { ...page, status: 'error' };
        
        // Handle Permission Denied or Not Found errors
        if (err.isAuthError || err.isNotFound) {
          setKeyError(true);
          setIsApiKeyReady(false);
          setError(err.isAuthError ? "权限被拒绝：请使用付费 API 密钥。" : "未找到模型：请检查您的 API 项目设置。");
          setIsProcessing(false);
          return; // Stop the whole queue
        }
      }
      
      setPages([...updatedPages]);
    }

    setIsProcessing(false);
    abortControllerRef.current = null;
  };

  const handleProcessSinglePage = async (pageNumber: number) => {
    if (isProcessing || (!isApiKeyReady && !keyError)) return;
    
    const pageIndex = pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) return;

    setIsProcessing(true);
    setError(null);
    setKeyError(false);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPages(prev => {
        const next = [...prev];
        next[pageIndex] = { ...next[pageIndex], status: 'processing' };
        return next;
    });

    try {
        const page = pages[pageIndex];
        const pagePrompt = page.customPrompt ? page.customPrompt.trim() : '';
        const combinedPrompt = [customPrompt.trim(), pagePrompt].filter(Boolean).join('\n\n[页面特定指令]:\n');

        const enhancedImage = await enhancePageImage(
            page.originalImage,
            quality,
            page.aspectRatio,
            controller.signal,
            combinedPrompt
        );

        setPages(prev => {
            const next = [...prev];
            next[pageIndex] = { 
                ...next[pageIndex], 
                processedImage: enhancedImage, 
                status: 'completed' 
            };
            return next;
        });
    } catch (err: any) {
        if (err.name !== 'AbortError') {
             console.error(`Error retrying page ${pageNumber}:`, err);
             setPages(prev => {
                const next = [...prev];
                next[pageIndex] = { ...next[pageIndex], status: 'error' };
                return next;
            });

            if (err.isAuthError || err.isNotFound) {
              setKeyError(true);
              setIsApiKeyReady(false);
              setError(err.isAuthError ? "权限被拒绝：请使用付费 API 密钥。" : "未找到模型：请检查您的 API 项目设置。");
            }
        } else {
             setPages(prev => {
                const next = [...prev];
                next[pageIndex] = { ...next[pageIndex], status: 'pending' };
                return next;
            });
        }
    } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
    }
  };

  const handleStopProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDownloadPdf = () => {
    try {
      generatePdfFromImages(pages, sessionName || fileName);
    } catch (err) {
      console.error(err);
      setError("生成 PDF 失败。");
    }
  };

  const handleDownloadPpt = async () => {
    try {
      await generatePptFromImages(pages, sessionName || fileName);
    } catch (err) {
      console.error(err);
      setError("生成 PowerPoint 失败。");
    }
  };

  const handleDownloadZip = async () => {
    try {
      await downloadAllAsZip(pages, sessionName || fileName);
    } catch (err) {
      console.error(err);
      setError("生成 ZIP 压缩包失败。");
    }
  };

  const stats = {
    total: pages.length,
    completed: pages.filter(p => p.status === 'completed').length,
    errors: pages.filter(p => p.status === 'error').length
  };

  const isAllDone = stats.total > 0 && stats.completed + stats.errors === stats.total;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      
      {/* Session Sidebar */}
      <SessionSidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="bg-blue-600 p-2 rounded-lg hidden sm:block">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 truncate">
                PDF 中文字体修复工具
              </h1>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center text-sm text-gray-500">
                  由 Gemini 3 Pro 驱动
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            <ApiKeySelector 
              onReady={() => { setIsApiKeyReady(true); setKeyError(false); }} 
              forceShow={keyError}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Controls */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-gray-500" />
                    输入文档
                  </h2>
                  
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center group">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="bg-blue-50 p-3 rounded-full group-hover:bg-blue-100 transition-colors">
                        <FileUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-700 truncate w-full text-center px-2">
                        {fileName ? fileName : "拖放 PDF 或点击上传"}
                      </div>
                      <div className="text-xs text-gray-500">
                        仅限 PDF 文件
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                {/* Settings Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-100 transition-opacity">
                   <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    输出质量
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-gray-500">
                       选择重建页面的分辨率。高质量需要更长的生成时间。
                     </p>
                     <div className="grid grid-cols-3 gap-3">
                        {(['1K', '2K', '4K'] as ImageQuality[]).map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuality(q)}
                            disabled={isProcessing}
                            className={`py-2 px-3 text-sm font-medium rounded-md border transition-all ${
                              quality === q 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                     </div>
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pt-4 border-t border-gray-100">
                    <MessageSquarePlus className="w-5 h-5 text-gray-500" />
                    全局指令
                  </h2>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      可选：添加应用于所有页面的请求（例如：“加粗文字”）。
                    </p>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      disabled={isProcessing}
                      placeholder="在此输入全局指令..."
                      className="w-full h-24 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Action Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">检测到的页面：</span>
                      <span className="font-medium">{pages.length}</span>
                    </div>
                    
                    {stats.completed > 0 && (
                       <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">已完成：</span>
                        <span className="font-medium text-green-600">{stats.completed}</span>
                      </div>
                    )}

                    {!isProcessing ? (
                      <button
                        onClick={processPages}
                        disabled={(!isApiKeyReady && !keyError) || pages.length === 0 || isAllDone}
                        className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all
                          ${(!isApiKeyReady && !keyError) || pages.length === 0 || isAllDone
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform active:scale-95'
                          }`}
                      >
                        {isAllDone ? (
                          '所有页面处理完毕'
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            开始修复
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleStopProcessing}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all bg-red-600 hover:bg-red-700 hover:shadow-lg transform active:scale-95"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        停止处理
                      </button>
                    )}

                    {stats.completed > 0 && !isProcessing && (
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={handleDownloadPdf}
                          className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          下载 PDF
                        </button>
                        <button
                          onClick={handleDownloadPpt}
                          className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Presentation className="w-4 h-4 mr-2" />
                          导出为 PPT
                        </button>
                        <button
                          onClick={handleDownloadZip}
                          className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <FileArchive className="w-4 h-4 mr-2" />
                          下载所有图片 (ZIP)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Queue & Preview */}
              <div className="lg:col-span-2 space-y-6">
                {pages.length === 0 ? (
                   <div className="h-96 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-16 h-16 mb-4 opacity-20" />
                      <p>上传 PDF 以查看页面</p>
                   </div>
                ) : (
                  <ProcessingQueue 
                    pages={pages} 
                    onRetry={handleProcessSinglePage} 
                    onUpdatePagePrompt={handleUpdatePagePrompt}
                    onReplaceImage={handleReplaceImage}
                    onPromoteImage={handlePromoteImage}
                  />
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;