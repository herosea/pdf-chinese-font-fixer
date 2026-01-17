
import React, { useState } from 'react';
import { PdfPage, CompressionLevel } from '../types';
import { 
  CheckCircle, Loader2, XCircle, RefreshCw, 
  Play, Maximize2, Sparkles, Trash2, Plus,
  Image as ImageIcon, Type
} from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';
import { extractTextFromPage, cleanHiddenChars } from '../services/geminiService';

interface ProcessingQueueProps {
  pages: PdfPage[];
  onRetry: (id: string) => void;
  onUpdatePagePrompt: (pageNumber: number, prompt: string) => void;
  onDeletePage: (id: string) => void;
  onInsertPage: (index: number) => void;
  compressionLevel: CompressionLevel;
}

type PreviewType = 'original' | 'fixed';

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
      const rawText = await extractTextFromPage(page.originalImage);
      if (rawText) {
        onUpdatePagePrompt(page.pageNumber, rawText);
      }
    } catch (err) { alert("文字提取失败，请重试。"); }
    finally { setIsExtracting(prev => ({ ...prev, [page.id]: false })); }
  };

  const handleTextChange = (pageNumber: number, newText: string) => {
    const cleaned = cleanHiddenChars(newText);
    onUpdatePagePrompt(pageNumber, cleaned);
  };

  const getPreviewUrl = (page: PdfPage, mode: PreviewType) => {
    if (mode === 'fixed' && page.processedImage) return page.processedImage;
    return page.originalImage;
  };

  const getModeLabel = (mode: PreviewType) => {
    switch(mode) {
      case 'original': return '原始图像';
      case 'fixed': return 'AI 修复后 (4K)';
      default: return '预览';
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
            
            const currentMode = previewModes[page.id] || (page.processedImage ? 'fixed' : 'original');
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
                         hasOcr ? '语义提取成功' : '等待手动提取文字'}
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[750px]">
                      {/* 左侧：超大预览区 (占 9/12) */}
                      <div className="lg:col-span-9 flex flex-col gap-4">
                        <div className="flex justify-between items-end px-1">
                          <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> 巨幕对照视图
                          </h5>
                          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                            <button
                              disabled={!page.originalImage}
                              onClick={() => setPreviewModes(prev => ({...prev, [page.id]: 'original'}))}
                              className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${currentMode === 'original' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600 disabled:opacity-20'}`}
                            >
                              原件
                            </button>
                            <button
                              disabled={!page.processedImage}
                              onClick={() => setPreviewModes(prev => ({...prev, [page.id]: 'fixed'}))}
                              className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${currentMode === 'fixed' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600 disabled:opacity-20'}`}
                            >
                              4K 修复
                            </button>
                          </div>
                        </div>
                        
                        <div 
                          className="flex-1 bg-gray-50 rounded-[40px] flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner relative group cursor-zoom-in transition-all hover:shadow-2xl"
                          onClick={() => setPreview({ url: previewUrl, title: `页面 ${page.pageNumber} - ${getModeLabel(currentMode)}` })}
                        >
                          <img 
                            src={previewUrl} 
                            className="max-w-[95%] max-h-[95%] object-contain transition-all duration-700 group-hover:scale-[1.02]" 
                            alt={`页面预览 ${page.pageNumber}`}
                          />
                          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold border border-white/20">
                                <Maximize2 className="w-4 h-4" />
                                点击进入全屏模式
                             </div>
                          </div>
                          
                          {/* Loading states overlay */}
                          {(extracting || page.status === 'processing') && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center animate-in fade-in z-20">
                              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4 drop-shadow-md" />
                              <h6 className="text-xl font-black text-gray-900 drop-shadow-md">
                                {page.status === 'processing' ? '4K 边缘重构中...' : '文字识别中...'}
                              </h6>
                              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-2 drop-shadow-sm">
                                {page.status === 'processing' ? 'AI 正在绘制每一个像素' : 'Gemini 正在提取语义'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 右侧：纵向编辑器 (占 3/12) */}
                      <div className="lg:col-span-3 flex flex-col gap-4">
                        <div className="flex justify-between items-center px-1">
                          <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Type className="w-4 h-4" /> 修复指令（含修改文字）
                          </h5>
                          <button onClick={() => handleExtractText(page)} disabled={extracting || isProcessing} className="flex items-center gap-2 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-xs font-bold" title="提取画面中的文字">
                            <RefreshCw className={`w-3.5 h-3.5 ${extracting ? 'animate-spin' : ''}`} />
                            提取/刷新文字
                          </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                          <textarea
                            value={page.customPrompt || ''}
                            onChange={(e) => handleTextChange(page.pageNumber, e.target.value)}
                            placeholder="点击上方“提取文字”按钮获取图像内容，或在此手动输入正确的文字。AI 将严格按照此处的文本进行重构。"
                            className="flex-1 w-full p-5 text-sm leading-relaxed border border-gray-200 rounded-[24px] bg-gray-50/30 shadow-inner resize-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500 focus:bg-white transition-all font-sans"
                          />
                          
                          <button 
                            onClick={() => onRetry(page.id)} 
                            disabled={isProcessing} 
                            className="w-full py-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[24px] font-black text-base flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
                          >
                            <Sparkles className="w-5 h-5" /> 
                            {page.status === 'completed' ? '重新生成' : '开始重构'}
                          </button>
                          <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">耗时约 15 秒</p>
                        </div>
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
