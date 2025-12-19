import React, { useState } from 'react';
import { PdfPage } from '../types';
import { CheckCircle, Loader2, XCircle, Clock, Search, ArrowRight, RefreshCw, MessageSquare, Play, ChevronDown, ChevronUp, ZoomIn } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

interface ProcessingQueueProps {
  pages: PdfPage[];
  onRetry?: (pageNumber: number) => void;
  onUpdatePagePrompt?: (pageNumber: number, prompt: string) => void;
}

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ pages, onRetry, onUpdatePagePrompt }) => {
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<number>>(new Set());

  const togglePrompt = (pageNumber: number) => {
    const newSet = new Set(expandedPromptIds);
    if (newSet.has(pageNumber)) {
      newSet.delete(pageNumber);
    } else {
      newSet.add(pageNumber);
    }
    setExpandedPromptIds(newSet);
  };

  if (pages.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Processing Queue</h3>
          <span className="text-sm text-gray-500">
            {pages.filter(p => p.status === 'completed').length} / {pages.length} Completed
          </span>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => {
              const isExpanded = expandedPromptIds.has(page.pageNumber);
              const hasCustomPrompt = page.customPrompt && page.customPrompt.trim().length > 0;
              const isProcessing = page.status === 'processing';

              return (
                <li key={page.pageNumber} className="hover:bg-gray-50 transition-colors flex flex-col group/item border-b border-gray-100 last:border-0">
                  <div 
                    className="p-4 flex items-center space-x-4 cursor-pointer" 
                    onClick={() => onUpdatePagePrompt && togglePrompt(page.pageNumber)}
                  >
                    {/* Status Icon & Action */}
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

                    {/* Content */}
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

                    {/* Controls */}
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      
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
                          <MessageSquare className="w-4 h-4" />
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
                            <RefreshCw className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Previews */}
                      <div 
                        className="relative group w-10 h-14 bg-gray-100 border rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all flex-shrink-0"
                        onClick={() => setPreview({ url: page.originalImage, title: `Page ${page.pageNumber} - Original` })}
                      >
                        <img src={page.originalImage} alt="Original" className="w-full h-full object-cover" />
                      </div>
                      
                      {page.processedImage ? (
                        <>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <div 
                            className="relative group w-10 h-14 bg-gray-100 border rounded overflow-hidden cursor-pointer ring-2 ring-green-100 hover:ring-green-500 transition-all flex-shrink-0"
                            onClick={() => setPreview({ url: page.processedImage!, title: `Page ${page.pageNumber} - Processed` })}
                          >
                            <img src={page.processedImage} alt="Processed" className="w-full h-full object-cover" />
                          </div>
                        </>
                      ) : (
                         <div className="w-10 h-14 border-2 border-dashed border-gray-200 rounded flex items-center justify-center flex-shrink-0 ml-1">
                           <span className="text-[10px] text-gray-300">...</span>
                         </div>
                      )}
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
                              <button 
                                onClick={() => setPreview({ url: page.originalImage, title: `Page ${page.pageNumber} - Original` })}
                                className="text-xs text-blue-600 flex items-center hover:underline"
                              >
                                <ZoomIn className="w-3 h-3 mr-1" />
                                Full Screen
                              </button>
                           </div>
                           <div className="bg-gray-200/50 rounded-lg border border-gray-300 overflow-hidden shadow-inner h-80 flex items-center justify-center relative">
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
                                  className="flex-1 w-full text-sm p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[120px]"
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