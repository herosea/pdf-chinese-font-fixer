
import React, { useState } from 'react';
import { PdfPage } from '../types';
import { 
  CheckCircle, Loader2, XCircle, Clock, Search, ArrowRight, RefreshCw, 
  MessageSquare, Play, ChevronDown, ChevronUp, ZoomIn, Download, 
  Upload as UploadIcon, ArrowLeftCircle, Wand2, Type, Maximize2, Sparkles, Trash2, Plus,
  Image as ImageIcon, Fullscreen
} from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';
import { extractTextFromPage } from '../services/geminiService';

interface ProcessingQueueProps {
  pages: PdfPage[];
  onRetry: (id: string) => void;
  onUpdatePagePrompt: (pageNumber: number, prompt: string) => void;
  onDeletePage: (id: string) => void;
  onInsertPage: (index: number) => void;
}

type PreviewType = 'original' | 'fixed' | 'compressed';

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ 
  pages, onRetry, onUpdatePagePrompt, onDeletePage, onInsertPage 
}) => {
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(new Set());
  const [isExtracting, setIsExtracting] = useState<Record<string, boolean>>({});
  const [previewModes, setPreviewModes] = useState<Record<string, PreviewType>>({});

  const togglePrompt = (id: string) => {
    const newSet = new Set(expandedPromptIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedPromptIds(newSet);
  };

  const handleExtractText = async (page: PdfPage) => {
    setIsExtracting(prev => ({ ...prev, [page.id]: true }));
    try {
      const text = await extractTextFromPage(page.originalImage);
      if (text) onUpdatePagePrompt(page.pageNumber, text);
    } catch (err) { alert("文字提取失败，请重试。"); }
    finally { setIsExtracting(prev => ({ ...prev, [page.id]: false })); }
  };

  const getPreviewUrl = (page: PdfPage, mode: PreviewType) => {
    if (mode === 'compressed' && page.compressedImage) return page.compressedImage;
    if (mode === 'fixed' && page.processedImage) return page.processedImage;
    return page.originalImage;
  };

  const getModeLabel = (mode: PreviewType) => {
    switch(mode) {
      case 'original': return '原始图像';
      case 'fixed': return 'AI 修复后 (4K)';
      case 'compressed': return '智能压缩后';
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
            待处理页面 <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] tracking-normal">{pages.length}</span>
          </h3>
          <button onClick={() => onInsertPage(0)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-50 transition-all shadow-sm active:scale-95">
            <Plus className="w-3.5 h-3.5" /> 首页前插入
          </button>
        </div>
        
        <div className="divide-y divide-gray-50">
          {pages.length === 0 ? (
            <div className="p-32 flex flex-col items-center justify-center text-gray-300">
              <ImageIcon className="w-20 h-20 mb-6 opacity-5" />
              <p className="text-sm font-bold tracking-widest uppercase">请点击左侧载入 PDF 或图片</p>
            </div>
          ) : pages.map((page, index) => {
            const isExpanded = expandedPromptIds.has(page.id);
            const isProcessing = page.status === 'processing';
            const extracting = isExtracting[page.id];
            const hasOcr = (page.customPrompt && page.customPrompt.length > 1);
            
            const currentMode = previewModes[page.id] || (page.compressedImage ? 'compressed' : (page.processedImage ? 'fixed' : 'original'));
            const previewUrl = getPreviewUrl(page, currentMode);

            return (
              <div key={page.id} className="flex flex-col bg-white">
                <div 
                  className={`p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`} 
                  onClick={() => togglePrompt(page.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-base shadow-sm border transition-all ${
                      page.status === 'completed' ? 'bg-green-50 border-green-100 text-green-600' :
                      page.status === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
                      'bg-gray-50 border-gray-100 text-gray-400'
                    }`}>
                      {isProcessing ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> : (
                        page.status === 'completed' ? <CheckCircle className="w-6 h-6" /> :
                        page.status === 'error' ? <XCircle className="w-6 h-6" /> :
                        <span>{page.pageNumber}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-800 flex items-center gap-3">
                        第 {page.pageNumber} 页
                        {extracting && <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] rounded-full animate-pulse font-black uppercase"><RefreshCw className="w-3 h-3 animate-spin" /> 内容分析</span>}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {page.status === 'completed' ? '重构已就绪' : 
                         page.status === 'processing' ? '正在执行 4K 增强' : 
                         hasOcr ? '语义提取成功' : '等待 AI 指令'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onInsertPage(index + 1)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Plus className="w-5 h-5" /></button>
                    <button onClick={() => onDeletePage(page.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    <button onClick={() => togglePrompt(page.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${isExpanded ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}>
                      {isExpanded ? '收起编辑器' : '展开详情与修复'}
                    </button>
                    <button onClick={() => onRetry(page.id)} disabled={isProcessing} className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl disabled:opacity-30 transition-all border border-green-100 shadow-sm"><Play className="w-5 h-5" /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-8 border-t border-blue-50 bg-white animate-in slide-in-from-top-4 duration-500">
                    {/* 顶部超大预览区：利用所有横向空间 */}
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-end px-1">
                        <div>
                          <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                            <ImageIcon className="w-4 h-4" /> 巨幕视图对照
                          </h5>
                          <p className="text-xs text-gray-500">点击下方图像中心可进入全屏沉浸模式，右上角可切换修复前后状态。</p>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                          {(['original', 'fixed', 'compressed'] as PreviewType[]).map((mode) => {
                            const isAvailable = (mode === 'original') || (mode === 'fixed' && page.processedImage) || (mode === 'compressed' && page.compressedImage);
                            return (
                              <button
                                key={mode}
                                disabled={!isAvailable}
                                onClick={() => setPreviewModes(prev => ({...prev, [page.id]: mode}))}
                                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${currentMode === mode ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600 disabled:opacity-20'}`}
                              >
                                {mode === 'original' ? '原件' : mode === 'fixed' ? '4K 修复' : '压缩'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div 
                        className="bg-gray-50 rounded-[40px] h-[700px] flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner relative group cursor-zoom-in transition-all hover:shadow-2xl"
                        onClick={() => setPreview({ url: previewUrl, title: `页面 ${page.pageNumber} - ${getModeLabel(currentMode)}` })}
                      >
                        <img 
                          src={previewUrl} 
                          className="max-w-[95%] max-h-[95%] object-contain transition-all duration-700 group-hover:scale-[1.03]" 
                          alt={`页面预览 ${page.pageNumber}`}
                        />

                        {/* 全屏显眼引导 */}
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                           <div className="bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold border border-white/20">
                              <Maximize2 className="w-4 h-4" />
                              点击查看超清大图
                           </div>
                        </div>
                        
                        {!page.processedImage && !hasOcr && !extracting && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-lg flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-xl border border-blue-100">
                              <Clock className="w-10 h-10 text-blue-500" />
                            </div>
                            <h6 className="text-xl font-black text-gray-900 mb-2">深度语义提取中...</h6>
                            <p className="text-sm text-gray-500 max-w-sm leading-relaxed font-medium">Gemini 正在识别该页面的文字层级，提取后的内容将出现在下方编辑器中，协助您精准重构。</p>
                          </div>
                        )}

                        {page.status === 'processing' && (
                          <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-sm flex items-center justify-center">
                            <div className="bg-white px-8 py-5 rounded-3xl shadow-2xl border border-blue-100 flex flex-col items-center gap-4">
                              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                              <span className="text-sm font-black text-blue-600 uppercase tracking-widest animate-pulse">4K 字体边缘重构中...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 底部编辑器与控制 */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-gray-50 pt-8">
                      <div className="lg:col-span-8 space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Type className="w-4 h-4" /> 智能重构指令 (语义微调)
                          </h5>
                          <button onClick={() => handleExtractText(page)} disabled={extracting || isProcessing} className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
                            <RefreshCw className={`w-4 h-4 ${extracting ? 'animate-spin' : ''}`} /> 重新扫描文字
                          </button>
                        </div>
                        <div className="relative">
                          <textarea
                            value={page.customPrompt || ''}
                            onChange={(e) => onUpdatePagePrompt(page.pageNumber, e.target.value)}
                            placeholder="这里显示 AI 自动提取的文字。修改此处内容，图像重构时会以此为准修复错别字或模糊字迹..."
                            className="w-full min-h-[180px] p-6 text-base leading-relaxed border border-gray-200 rounded-[24px] bg-gray-50/30 shadow-inner resize-none focus:ring-8 focus:ring-blue-100/50 focus:border-blue-500 focus:bg-white transition-all font-sans"
                          />
                        </div>
                      </div>
                      <div className="lg:col-span-4 flex flex-col h-full pt-6">
                        <button 
                          onClick={() => onRetry(page.id)} 
                          disabled={isProcessing} 
                          className="w-full py-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] font-black text-lg flex flex-col items-center justify-center gap-2 shadow-2xl shadow-blue-100 hover:shadow-blue-300 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                          <Sparkles className="w-6 h-6" /> 
                          {page.status === 'completed' ? '重新生成 4K 画质' : '立即重构该页'}
                        </button>
                        <p className="mt-4 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">修复过程约需 10-20 秒</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {pages.length > 0 && (
            <div className="p-12 flex justify-center bg-gray-50/30">
              <button 
                onClick={() => onInsertPage(pages.length)} 
                className="flex items-center gap-3 px-12 py-4 border-2 border-dashed border-gray-200 rounded-[24px] text-sm font-black text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-white transition-all group"
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" /> 
                在此处插入后续页面
              </button>
            </div>
          )}
        </div>
      </div>
      <ImagePreviewModal imageUrl={preview?.url || null} title={preview?.title} onClose={() => setPreview(null)} />
    </>
  );
};

export default ProcessingQueue;
