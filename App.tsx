
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileUp, Sparkles, Download, AlertCircle, FileText, Image as ImageIcon, StopCircle, MessageSquarePlus, Presentation, FileArchive, Menu, Plus, Trash2, Layers, PanelLeftClose, PanelLeftOpen, Archive, Zap, Loader2 } from 'lucide-react';
import { PdfPage, ImageQuality, SessionMetadata, CompressionLevel } from './types';
import { extractImagesFromPdf, generatePdfFromImages, fileToBase64, getImageDimensions } from './services/pdfService';
import { generatePptFromImages } from './services/pptService';
import { extractImagesFromPpt } from './services/pptImportService';
import { enhancePageImage, extractTextFromPage } from './services/geminiService';
import { downloadAllAsZip } from './services/zipService';
import { compressImage, getCompressionRatio } from './services/imageService';
import { saveSession, getSession, getAllSessionsMetadata, deleteSession, updateSessionName } from './services/storageService';
import ProcessingQueue from './components/ProcessingQueue';
import ApiKeySelector from './components/ApiKeySelector';
import SessionSidebar from './components/SessionSidebar';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState<ImageQuality>('4K');
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('balanced');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // New states for format handling
  const [exportFormat, setExportFormat] = useState<'pdf' | 'ppt' | 'zip'>('ppt');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const processingOcrIds = useRef<Set<string>>(new Set());
  const MAX_CONCURRENT_OCR = 3; 

  useEffect(() => { loadSessionList(); }, []);

  useEffect(() => {
    if (!isApiKeyReady || isProcessing) return;
    const activeCount = processingOcrIds.current.size;
    const availableSlots = MAX_CONCURRENT_OCR - activeCount;
    if (availableSlots <= 0) return;

    const candidates = pages.filter(p => 
      p.status === 'pending' && 
      (!p.customPrompt || p.customPrompt.length < 2) && 
      !processingOcrIds.current.has(p.id)
    ).slice(0, availableSlots);

    if (candidates.length === 0) return;

    candidates.forEach(page => {
      processingOcrIds.current.add(page.id);
      extractTextFromPage(page.originalImage)
        .then(text => {
          if (text) {
            setPages(prev => prev.map(p => p.id === page.id ? { ...p, customPrompt: text } : p));
          }
        })
        .catch(e => { console.warn(`自动 OCR 失败，页面 ${page.pageNumber}`, e); })
        .finally(() => { processingOcrIds.current.delete(page.id); });
    });
  }, [pages, isApiKeyReady, isProcessing]);

  useEffect(() => {
    if (!currentSessionId || pages.length === 0) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => handleSaveSession(), 2000);
    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
  }, [pages, fileName, customPrompt, quality, currentSessionId, sessionName, compressionLevel]);

  const handleSaveSession = useCallback(async () => {
    if (!currentSessionId) return;
    const sessionData = {
      id: currentSessionId, name: sessionName || fileName || '未命名会话',
      createdAt: sessions.find(s => s.id === currentSessionId)?.createdAt || Date.now(),
      lastModified: Date.now(), pages, fileName, customPrompt, quality, compressionLevel
    };
    try { await saveSession(sessionData); loadSessionList(); } catch (e) { console.error("自动保存失败", e); }
  }, [currentSessionId, sessionName, fileName, pages, quality, compressionLevel, sessions]);

  const handleNewSession = () => {
    if (isProcessing) return;
    setPages([]); setFileName(''); setSessionName(''); setCustomPrompt(''); setError(null);
    setCurrentSessionId(crypto.randomUUID()); 
  };

  const loadSessionList = async () => { try { setSessions(await getAllSessionsMetadata()); } catch (e) { console.error(e); } };

  const handleSelectSession = async (id: string) => {
    if (isProcessing) { if (!confirm("正在处理中，确定要切换吗？")) return; handleStopProcessing(); }
    try {
      const s = await getSession(id);
      if (s) {
        setCurrentSessionId(s.id); setPages(s.pages); setFileName(s.fileName);
        setSessionName(s.name); setCustomPrompt(s.customPrompt); setQuality(s.quality);
        setCompressionLevel(s.compressionLevel || 'balanced'); setError(null);
      }
    } catch (e) { setError("加载会话失败"); }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (pages.length === 0) setCurrentSessionId(crypto.randomUUID());
    setFileName(file.name); setSessionName(file.name); setError(null);
    
    try {
      if (file.type === 'application/pdf') {
        const newPages = await extractImagesFromPdf(file);
        setPages(newPages);
      } else if (file.name.toLowerCase().endsWith('.pptx') || file.type.includes('presentation')) {
        const newPages = await extractImagesFromPpt(file);
        if (newPages.length === 0) {
          setError('未在 PPT 中发现嵌入的图片。如果是纯文本 PPT，请先导出为 PDF 再上传。');
          setPages([]);
        } else {
          setPages(newPages);
        }
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        const { width, height } = await getImageDimensions(base64);
        const newPage: PdfPage = {
          id: crypto.randomUUID(), pageNumber: 1, originalImage: base64, processedImage: null,
          compressedImage: null, status: 'pending', width, height, aspectRatio: width/height, customPrompt: ''
        };
        setPages([newPage]);
      } else if (file.name.toLowerCase().endsWith('.ppt')) {
        setError('暂不支持旧版 .ppt 格式，请另存为 .pptx 或 PDF 后重试。');
      } else { 
        setError('不支持的文件格式。请上传 PDF, PPTX 或图片。'); 
      }
    } catch (err: any) { 
      setError(err.message || '读取文件失败。'); 
    }
    
    if (event.target) event.target.value = '';
  };

  const triggerFileInput = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getBaseName = (name: string) => name.replace(/\.[^/.]+$/, "");

  const handleExport = async () => {
    if (pages.length === 0 || isExporting) return;
    setIsExporting(true);
    
    try {
      // 1. Prepare images: Apply compression if needed to either the processed or original image
      const pagesToExport = await Promise.all(pages.map(async (page) => {
        // Prioritize processed image, fallback to original
        const sourceImage = page.processedImage || page.originalImage;
        let finalImage = sourceImage;
        
        // Apply compression based on current settings
        if (compressionLevel !== 'none') {
          finalImage = await compressImage(sourceImage, getCompressionRatio(compressionLevel));
        }
        
        // Return a page object with the final image set as 'compressedImage'
        // Generators use compressedImage || processedImage || originalImage
        return {
          ...page,
          compressedImage: finalImage 
        };
      }));

      const outputName = sessionName || getBaseName(fileName);
      // Add suffix based on what we are exporting
      const hasRepaired = pages.some(p => p.status === 'completed');
      const suffix = hasRepaired ? '_修复版' : '_压缩版';
      const finalFileName = `${outputName}${suffix}`;
      
      if (exportFormat === 'ppt') {
        await generatePptFromImages(pagesToExport, finalFileName);
      } else if (exportFormat === 'zip') {
        await downloadAllAsZip(pagesToExport, finalFileName);
      } else {
        generatePdfFromImages(pagesToExport, finalFileName);
      }
    } catch (e) {
      console.error(e);
      alert("导出失败: " + (e as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeletePage = (id: string) => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    });
  };

  const handleInsertPage = async (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const base64 = await fileToBase64(file);
        const { width, height } = await getImageDimensions(base64);
        const newPage: PdfPage = {
          id: crypto.randomUUID(), pageNumber: 0, originalImage: base64, processedImage: null,
          compressedImage: null, status: 'pending', width, height, aspectRatio: width/height, customPrompt: ''
        };
        setPages(prev => {
          const next = [...prev];
          next.splice(index, 0, newPage);
          return next.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        });
      }
    };
    input.click();
  };

  const processPages = async () => {
    if (pages.length === 0 || (!isApiKeyReady && !keyError)) return;
    setIsProcessing(true); setError(null);
    const controller = new AbortController(); abortControllerRef.current = controller;
    for (let i = 0; i < pages.length; i++) {
      if (controller.signal.aborted) break;
      const page = pages[i];
      if (page.status === 'completed') continue;
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: 'processing' } : p));
      try {
        const combinedPrompt = [customPrompt.trim(), page.customPrompt?.trim()].filter(Boolean).join('\n\n[特定内容]:\n');
        const enhanced = await enhancePageImage(page.originalImage, quality, page.aspectRatio, controller.signal, combinedPrompt);
        // During processing, we don't compress immediately to save time, compression happens at export
        setPages(prev => prev.map(p => p.id === page.id ? { ...p, processedImage: enhanced, status: 'completed' } : p));
      } catch (err: any) {
        if (controller.signal.aborted) break;
        setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: 'error' } : p));
        if (err.isAuthError || err.isNotFound) { setError(err.message); setIsProcessing(false); return; }
      }
    }
    setIsProcessing(false);
  };

  const handleProcessSinglePage = async (id: string) => {
    if (isProcessing) return;
    const page = pages.find(p => p.id === id);
    if (!page) return;
    setIsProcessing(true);
    const controller = new AbortController(); abortControllerRef.current = controller;
    setPages(prev => prev.map(p => p.id === id ? { ...p, status: 'processing' } : p));
    try {
      const combinedPrompt = [customPrompt.trim(), page.customPrompt?.trim()].filter(Boolean).join('\n\n[特定内容]:\n');
      const enhanced = await enhancePageImage(page.originalImage, quality, page.aspectRatio, controller.signal, combinedPrompt);
      setPages(prev => prev.map(p => p.id === id ? { ...p, processedImage: enhanced, status: 'completed' } : p));
    } catch (e) {
      setPages(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
    } finally { setIsProcessing(false); }
  };

  const handleStopProcessing = () => abortControllerRef.current?.abort();

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      <SessionSidebar sessions={sessions} currentSessionId={currentSessionId} onSelectSession={handleSelectSession} onNewSession={handleNewSession} onDeleteSession={deleteSession} onRenameSession={updateSessionName} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-gray-100 flex-shrink-0 z-10 px-4 lg:px-6 h-16 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border group active:scale-95 shadow-sm
                ${isSidebarOpen 
                  ? 'bg-blue-50 text-blue-600 border-blue-200' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              <span className="text-xs font-bold hidden md:inline">{isSidebarOpen ? '收起历史' : '历史记录'}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black text-gray-900 leading-none">Notebookllm pdf 修复大师</h1>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">智能中文字体高清重构</p>
              </div>
            </div>
          </div>
          {fileName && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 rounded-full border border-blue-100/50 max-w-xs overflow-hidden">
              <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-[10px] font-black text-blue-600 truncate uppercase tracking-tighter">{fileName}</span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1800px] mx-auto">
            <ApiKeySelector onReady={() => { setIsApiKeyReady(true); setKeyError(false); }} forceShow={keyError} />
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 shadow-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h2 className="text-[9px] font-black mb-3 flex items-center gap-2 text-gray-400 uppercase tracking-widest"><Upload className="w-3.5 h-3.5" /> 载入媒体</h2>
                  <div 
                    onClick={triggerFileInput}
                    className={`relative border border-dashed border-gray-200 rounded-xl p-4 transition-all text-center group cursor-pointer active:scale-[0.98] 
                      ${isProcessing ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-blue-50/50 hover:border-blue-400 hover:shadow-sm bg-gray-50/30'}`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      disabled={isProcessing} 
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-md transition-all">
                        {fileName ? <FileText className="w-4 h-4 text-green-600" /> : <Presentation className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                        {fileName ? <span className="text-blue-600">更换文件</span> : <span>载入 PDF/PPT/图片</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h2 className="text-[9px] font-black mb-3 flex items-center gap-2 text-gray-400 uppercase tracking-widest"><Layers className="w-3.5 h-3.5" /> 核心设置</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 block">目标画质</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['1K', '2K', '4K'].map(q => (
                          <button key={q} onClick={() => setQuality(q as any)} className={`py-1.5 text-[9px] font-black rounded-lg border transition-all ${quality === q ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>{q}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 block">导出质量</label>
                      <select value={compressionLevel} onChange={(e) => setCompressionLevel(e.target.value as any)} className="w-full px-2 py-1.5 border border-gray-100 rounded-lg text-[10px] bg-gray-50 font-bold focus:ring-2 focus:ring-blue-100 outline-none">
                        <option value="none">无损 (原始)</option>
                        <option value="low">高 (90%)</option>
                        <option value="balanced">平 (60%)</option>
                        <option value="high">压 (30%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 block">导出格式</label>
                      <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} className="w-full px-2 py-1.5 border border-gray-100 rounded-lg text-[10px] bg-gray-50 font-bold focus:ring-2 focus:ring-blue-100 outline-none">
                        <option value="ppt">PPT演示文稿 (.pptx)</option>
                        <option value="pdf">PDF文档 (.pdf)</option>
                        <option value="zip">图片包 (.zip)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-4">
                  {!isProcessing ? (
                    <div className="space-y-3">
                      <button onClick={processPages} disabled={pages.length === 0} className="w-full flex items-center justify-center py-3 bg-gray-900 text-white rounded-xl text-xs font-bold disabled:bg-gray-100 disabled:text-gray-300 shadow-lg shadow-gray-100 hover:bg-black transition-all group active:scale-95">
                        <Sparkles className="w-3.5 h-3.5 mr-2 group-hover:rotate-12 transition-transform" /> 
                        开始重构
                      </button>
                      
                      <button 
                        onClick={handleExport} 
                        disabled={pages.length === 0 || isExporting} 
                        className="w-full flex items-center justify-center py-3 bg-blue-600 text-white shadow-lg shadow-blue-200 rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                      >
                        {isExporting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : (
                          exportFormat === 'ppt' ? <Presentation className="w-3.5 h-3.5 mr-2" /> :
                          exportFormat === 'pdf' ? <FileText className="w-3.5 h-3.5 mr-2" /> :
                          <Archive className="w-3.5 h-3.5 mr-2" />
                        )}
                        {pages.some(p => p.status === 'completed') ? '导出修复结果' : '导出文件 (仅压缩)'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleStopProcessing} className="w-full flex items-center justify-center py-3 bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-all active:scale-95">
                      <StopCircle className="w-3.5 h-3.5 mr-2" /> 
                      停止
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-10">
                <ProcessingQueue 
                  pages={pages} 
                  onRetry={handleProcessSinglePage} 
                  onUpdatePagePrompt={(pn, prompt) => setPages(prev => prev.map(p => p.pageNumber === pn ? { ...p, customPrompt: prompt } : p))}
                  onDeletePage={handleDeletePage}
                  onInsertPage={handleInsertPage}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
