import React from 'react';
import { PdfPage } from '../types';
import { CheckCircle, Loader2, XCircle, Clock, Search, ArrowRight } from 'lucide-react';

interface ProcessingQueueProps {
  pages: PdfPage[];
}

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ pages }) => {
  if (pages.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Processing Queue</h3>
        <span className="text-sm text-gray-500">
          {pages.filter(p => p.status === 'completed').length} / {pages.length} Completed
        </span>
      </div>
      
      <div className="max-h-[600px] overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {pages.map((page) => (
            <li key={page.pageNumber} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {page.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {page.status === 'processing' && <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />}
                  {page.status === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
                  {page.status === 'pending' && <Clock className="w-6 h-6 text-gray-300" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Page {page.pageNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {page.status === 'completed' ? 'Processing successful' : 
                     page.status === 'processing' ? 'Enhancing with Gemini AI...' :
                     page.status === 'error' ? 'Failed to process' : 'Waiting in queue'}
                  </p>
                </div>

                {/* Previews */}
                <div className="flex items-center space-x-2">
                  <div className="relative group w-12 h-16 bg-gray-100 border rounded overflow-hidden cursor-pointer">
                    <img src={page.originalImage} alt="Original" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {page.processedImage ? (
                    <>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="relative group w-12 h-16 bg-gray-100 border rounded overflow-hidden cursor-pointer ring-2 ring-green-100">
                        <img src={page.processedImage} alt="Processed" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Search className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                     <div className="w-12 h-16 border-2 border-dashed border-gray-200 rounded flex items-center justify-center ml-6">
                       <span className="text-xs text-gray-300">...</span>
                     </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProcessingQueue;
