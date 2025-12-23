import React, { useState, useRef } from 'react';
import { PdfPage } from '../types';
import { 
  CheckCircle, Loader2, XCircle, Clock, Search, ArrowRight, RefreshCw, 
  MessageSquare, Play, ChevronDown, ChevronUp, ZoomIn, Download, 
  Upload as UploadIcon, ArrowLeftCircle 
} from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

interface ProcessingQueueProps {
  pages: PdfPage[];
  onRetry?: (pageNumber: number) => void;
  onUpdatePagePrompt?: (pageNumber: number, prompt: string) => void;
  onReplaceImage?: (pageNumber: number, newImageBase64: string) => void;
  onPromoteImage?: (pageNumber: number) => void;
}

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ 
  pages, 
  onRetry, 
  onUpdatePagePrompt, 
  onReplaceImage, 
  onPromoteImage 
}) => {
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeReplacementPage = useRef<number | null>(null);

  const togglePrompt = (pageNumber: number) => {
    const newSet = new Set(expandedPromptIds);
    if (newSet.has(pageNumber)) {
      newSet.delete(pageNumber);
    } else {
      newSet.add(pageNumber);
    }
    setExpandedPromptIds(newSet);
  };

  const downloadSingleImage = (imageUrl: string, pageNumber: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const extension = imageUrl.includes('image/png') ? 'png' : 'jpg';
    link.download = `page_${pageNumber.toString().padStart(3, '0')}_fixed.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReplacementClick = (pageNumber: number) => {
    activeReplacementPage.current = pageNumber;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pageNumber = activeReplacementPage.current;
    if (file && pageNumber !== null && onReplaceImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onReplaceImage(pageNumber, reader.result as string);
        activeReplacementPage.current = null;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
  };

  if (pages.length === 0) return null;

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Processing Queue</h3>
          <span className="text-sm text-gray-500">
            {pages.filter(p => p.status === 'completed').length} / {pages.length} Completed
          </span>
        </div>
        
        <div className="max-h-[800px] overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => {
              const isExpanded = expandedPromptIds.has(page.pageNumber);
              const hasCustomPrompt = page.customPrompt && page.customPrompt.trim().length > 0;
              const isProcessing = page.status === 'processing';

              return (
                <li key={page.pageNumber} className="hover:bg-gray-50 transition-colors flex flex-col group/item border-b border-gray-100 last:border-0">
                  <div 
                    className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer" 
                    onClick={() => onUpdatePagePrompt && togglePrompt(page.pageNumber)}
                  >
                    {/* Status Icon & Info Section */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {isProcessing ? (
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                          ) : (
                            <div className="flex gap-1">
                              {/* Status Indicator */}
                              {page.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                              {page.status === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
                              {page.status === 'pending' && <Clock className="w-6 h-6 text-gray-300" />}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 select-none">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Page {page.pageNumber}
                            </p>
                            {hasCustomPrompt && !isExpanded && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Custom Prompt
                              </span>
                            )}
                            {!isProcessing && (
                                <span className="text-xs text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center">
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    {isExpanded ? 'Close editor' : 'Click to edit prompt'}
                                </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {page.status === 'completed' ? 'Processing successful' : 
                            page.status === 'processing' ? 'Enhancing with Gemini AI...' :
                            page.status === 'error' ? 'Failed to process' : 'Waiting in queue'}
                          </p>
                        </div>
                    </div>

                    {/* Visuals & Controls */}
                    <div className="flex items-center justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                      
                      <div className="flex items-center gap-2">
                          {/* Individual Download Button */}
                          {page.processedImage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSingleImage(page.processedImage!, page.pageNumber);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                              title="Download this page as image"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          )}

                          {/* Prompt Toggle */}
                          {onUpdatePagePrompt && (
                            <button
                              onClick={() => togglePrompt(page.pageNumber)}
                              className={`p-2 rounded-full transition-colors ${
                                isExpanded || hasCustomPrompt 
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                              }`}
                              title="Edit Page Prompt"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                          )}

                          {/* Re-run / Run Button */}
                          {onRetry && !isProcessing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRetry(page.pageNumber);
                              }}
                              className="p-2 text-gray-400 hover:bg-green-50 hover:text-green-600 rounded-full transition-colors"
                              title="Run this page again"
                            >
                              {page.status === 'completed' ? (
                                <RefreshCw className="w-5 h-5" />
                              ) : (
                                <Play className="w-5 h-5" />
                              )}
                            </button>
                          )}
                      </div>

                      {/* Previews with Actions */}
                      <div className="flex items-center gap-3">
                          {/* Original Preview Container */}
                          <div className="relative group/original flex-shrink-0">
                            <div 
                              className="w-32 h-44 bg-gray-100 border rounded-lg overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-400 transition-all shadow-sm"
                              onClick={() => setPreview({ url: page.originalImage, title: `Page ${page.pageNumber} - Original` })}
                            >
                              <img src={page.originalImage} alt="Original" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover/original:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/original:opacity-100">
                                  <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                              </div>
                            </div>
                            {/* Replace with Upload Button Overlay */}
                            {!isProcessing && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleReplacementClick(page.pageNumber); }}
                                className="absolute -top-2 -left-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover/original:opacity-100 transition-opacity hover:bg-blue-700 z-10"
                                title="Upload replacement image"
                              >
                                <UploadIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          {page.processedImage ? (
                            <>
                              <div className="flex flex-col items-center gap-2">
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                                {!isProcessing && (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); onPromoteImage?.(page.pageNumber); }}
                                     className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                     title="Use generated image as original"
                                   >
                                     <ArrowLeftCircle className="w-5 h-5" />
                                   </button>
                                )}
                              </div>
                              <div 
                                className="relative group/processed w-32 h-44 bg-gray-100 border rounded-lg overflow-hidden cursor-pointer ring-2 ring-green-100 hover:ring-4 hover:ring-green-500 transition-all flex-shrink-0 shadow-md"
                                onClick={() => setPreview({ url: page.processedImage!, title: `Page ${page.pageNumber} - Processed` })}
                              >
                                <img src={page.processedImage} alt="Processed" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover/processed:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/processed:opacity-100">
                                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                              </div>
                            </>
                          ) : (
                             <div className="w-32 h-44 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 bg-gray-50">
                               <div className="text-center px-2">
                                  <Loader2 className={`w-6 h-6 text-gray-300 mx-auto mb-2 ${isProcessing ? 'animate-spin' : ''}`} />
                                  <span className="text-xs text-gray-400">Waiting...</span>
                               </div>
                             </div>
                          )}
                      </div>

                    </div>
                  </div>
                  
                  {/* Expanded Prompt Editor with Large Preview */}
                  {isExpanded && onUpdatePagePrompt && (
                    <div 
                        className="px-4 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200 border-t border-gray-100 bg-gray-50/50 cursor-default"
                        onClick={(e) => e.stopPropagation()} 
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* Left: Image Reference */}
                        <div className="md:w-1/2 flex flex-col space-y-2">
                           <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-medium text-gray-500">Original Page Reference</span>
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => handleReplacementClick(page.pageNumber)}
                                  className="text-xs text-gray-600 flex items-center hover:underline"
                                >
                                  <UploadIcon className="w-3 h-3 mr-1" />
                                  Replace Image
                                </button>
                                <button 
                                  onClick={() => setPreview({ url: page.originalImage, title: `Page ${page.pageNumber} - Original` })}
                                  className="text-xs text-blue-600 flex items-center hover:underline"
                                >
                                  <ZoomIn className="w-3 h-3 mr-1" />
                                  Full Screen
                                </button>
                              </div>
                           </div>
                           <div className="bg-gray-200/50 rounded-lg border border-gray-300 overflow-hidden shadow-inner h-[500px] flex items-center justify-center relative">
                              <img 
                                src={page.originalImage} 
                                alt="Reference" 
                                className="max-w-full max-h-full object-contain" 
                              />
                           </div>
                        </div>

                        {/* Right: Controls */}
                        <div className="md:w-1/2 flex flex-col space-y-3">
                            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm h-full flex flex-col">
                                <label className="text-sm font-semibold text-gray-900 mb-1 block">
                                  Custom Repair Instructions
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                  Describe specific areas to fix (e.g., "The top-left stamp is blurry", "Fix the table borders").
                                </p>
                                
                                <textarea
                                  value={page.customPrompt || ''}
                                  onChange={(e) => onUpdatePagePrompt(page.pageNumber, e.target.value)}
                                  placeholder="Enter instructions for this specific page..."
                                  className="flex-1 w-full text-sm p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[120px] bg-white text-gray-900"
                                  disabled={isProcessing}
                                  autoFocus
                                />
                                
                                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                                   <button
                                     onClick={() => togglePrompt(page.pageNumber)}
                                     className="text-xs text-gray-500 hover:text-gray-700"
                                   >
                                     Cancel
                                   </button>
                                   <div className="flex gap-2">
                                      {page.processedImage && (
                                        <button
                                          onClick={() => onPromoteImage?.(page.pageNumber)}
                                          disabled={isProcessing}
                                          className="flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
                                        >
                                          Use Processed as Original
                                        </button>
                                      )}
                                      <button
                                         onClick={() => onRetry && onRetry(page.pageNumber)}
                                         disabled={isProcessing}
                                         className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm text-sm font-medium"
                                      >
                                        <Play className="w-4 h-4 mr-2" />
                                        Run Page {page.pageNumber}
                                      </button>
                                   </div>
                                </div>
                            </div>
                        </div>

                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ImagePreviewModal 
        imageUrl={preview?.url ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />
    </>
  );
};

export default ProcessingQueue;