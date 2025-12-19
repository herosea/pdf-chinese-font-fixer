import React, { useState, useCallback } from 'react';
import { Upload, FileUp, Sparkles, Download, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { PdfPage, ImageQuality } from './types';
import { extractImagesFromPdf, generatePdfFromImages } from './services/pdfService';
import { enhancePageImage } from './services/geminiService';
import ProcessingQueue from './components/ProcessingQueue';
import ApiKeySelector from './components/ApiKeySelector';

const App: React.FC = () => {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState<ImageQuality>('4K');
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setFileName(file.name);
    setError(null);
    setPages([]); // Reset
    
    try {
      const extractedPages = await extractImagesFromPdf(file);
      setPages(extractedPages);
    } catch (err) {
      console.error(err);
      setError('Failed to extract images from PDF. Please try another file.');
    }
  };

  const processPages = async () => {
    if (pages.length === 0 || !isApiKeyReady) return;
    
    setIsProcessing(true);
    setError(null);

    // Create a copy of pages to track updates
    const updatedPages = [...pages];

    // Process sequentially to handle potential rate limits elegantly, 
    // or we could do small batches. Given 4K genAI, sequential or small batch is safer.
    // Let's do sequential for simplicity and reliability with large model calls.
    for (let i = 0; i < updatedPages.length; i++) {
      const page = updatedPages[i];
      if (page.status === 'completed') continue; // Skip already done

      // Update status to processing
      updatedPages[i] = { ...page, status: 'processing' };
      setPages([...updatedPages]);

      try {
        const enhancedImage = await enhancePageImage(page.originalImage, quality, page.aspectRatio);
        updatedPages[i] = { 
          ...page, 
          processedImage: enhancedImage, 
          status: 'completed' 
        };
      } catch (err) {
        console.error(`Error processing page ${page.pageNumber}:`, err);
        updatedPages[i] = { ...page, status: 'error' };
        // Don't stop the whole queue, just mark this one as error
      }
      
      // Update state after each page
      setPages([...updatedPages]);
    }

    setIsProcessing(false);
  };

  const handleDownload = () => {
    try {
      generatePdfFromImages(pages);
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF.");
    }
  };

  const stats = {
    total: pages.length,
    completed: pages.filter(p => p.status === 'completed').length,
    errors: pages.filter(p => p.status === 'error').length
  };

  const isAllDone = stats.total > 0 && stats.completed + stats.errors === stats.total;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              PDF Chinese Font Fixer
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center text-sm text-gray-500">
                Powered by Gemini 3 Pro
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <ApiKeySelector onReady={() => setIsApiKeyReady(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-gray-500" />
                Input Document
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
                  <div className="text-sm font-medium text-gray-700">
                    {fileName ? fileName : "Drop PDF or Click to Upload"}
                  </div>
                  <div className="text-xs text-gray-500">
                    PDF files only
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
                Output Quality
              </h2>
              
              <div className="space-y-3">
                 <p className="text-sm text-gray-500">
                   Select the resolution for the reconstructed pages. Higher quality takes longer to generate.
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
            </div>

            {/* Action Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Pages detected:</span>
                  <span className="font-medium">{pages.length}</span>
                </div>
                
                {stats.completed > 0 && (
                   <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Completed:</span>
                    <span className="font-medium text-green-600">{stats.completed}</span>
                  </div>
                )}

                <button
                  onClick={processPages}
                  disabled={!isApiKeyReady || pages.length === 0 || isProcessing || isAllDone}
                  className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all
                    ${!isApiKeyReady || pages.length === 0 || isProcessing || isAllDone
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform active:scale-95'
                    }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : isAllDone ? (
                    'All Pages Processed'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Repair
                    </>
                  )}
                </button>

                {stats.completed > 0 && (
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Fixed PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Queue & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {pages.length === 0 ? (
               <div className="h-96 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p>Upload a PDF to view pages</p>
               </div>
            ) : (
              <ProcessingQueue pages={pages} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
