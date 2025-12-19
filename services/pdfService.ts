import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { PdfPage } from '../types';

// Set up the worker source. Using esm.sh to ensure compatibility with the ES module version of pdfjs-dist.
// We point to the .mjs worker file which is required for the module-based loader.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractImagesFromPdf = async (file: File): Promise<PdfPage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Configure CMaps and Standard Fonts to prevent fetch errors and improve rendering
  // The "Failed to construct 'Response'" error often occurs when pdf.js tries to fetch fonts 
  // and the environment interferes. Explicitly setting these URLs helps.
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    cMapUrl: `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: PdfPage[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Render at decent quality for input
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const base64 = canvas.toDataURL('image/jpeg', 0.95);
    // Remove prefix for consistency if needed, but data URLs are usually fine for display
    
    pages.push({
      pageNumber: i,
      originalImage: base64,
      processedImage: null,
      status: 'pending',
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height
    });
  }

  return pages;
};

export const generatePdfFromImages = (pages: PdfPage[], originalFileName?: string): void => {
  if (pages.length === 0) return;

  // Initialize with the orientation of the first page
  const firstPage = pages[0];
  const orientation = firstPage.width > firstPage.height ? 'l' : 'p';
  
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'px',
    format: [firstPage.width, firstPage.height] // Use pixel dimensions roughly
  });

  pages.forEach((page, index) => {
    if (index > 0) {
      // For subsequent pages, set their specific dimensions
      const pageOrientation = page.width > page.height ? 'l' : 'p';
      pdf.addPage([page.width, page.height], pageOrientation);
    }
    
    // Use processed image if available, otherwise fallback to original (though ideally all should be processed)
    const imgData = page.processedImage || page.originalImage;
    
    // Calculate dimensions to fit the page exactly
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfPageWidth, pdfPageHeight);
  });

  // Construct filename
  let outputName = 'fixed-document.pdf';
  if (originalFileName) {
    const nameWithoutExt = originalFileName.replace(/\.pdf$/i, '');
    outputName = `${nameWithoutExt}_fixed.pdf`;
  }

  pdf.save(outputName);
};