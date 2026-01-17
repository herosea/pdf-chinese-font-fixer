
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { PdfPage } from '@/types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const getImageDimensions = (base64: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = base64;
  });
};

export const extractImagesFromPdf = async (file: File): Promise<PdfPage[]> => {
  const arrayBuffer = await file.arrayBuffer();
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
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) continue;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvas: canvas, canvasContext: context, viewport: viewport }).promise;
    const base64 = canvas.toDataURL('image/jpeg', 0.9);

    pages.push({
      id: crypto.randomUUID(),
      pageNumber: i,
      originalImage: base64,
      processedImage: null,
      compressedImage: null,
      status: 'pending',
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      customPrompt: ''
    });
  }
  return pages;
};

export const generatePdfFromImages = (pages: PdfPage[], originalFileName?: string): void => {
  if (pages.length === 0) return;
  const firstPage = pages[0];
  const pdf = new jsPDF({
    orientation: firstPage.width > firstPage.height ? 'l' : 'p',
    unit: 'px',
    format: [firstPage.width, firstPage.height]
  });

  pages.forEach((page, index) => {
    if (index > 0) {
      pdf.addPage([page.width, page.height], page.width > page.height ? 'l' : 'p');
    }
    const imgData = page.compressedImage || page.processedImage || page.originalImage;
    pdf.addImage(imgData, 'JPEG', 0, 0, page.width, page.height);
  });

  pdf.save(originalFileName ? `${originalFileName.replace(/\.pdf$/i, '')}_fixed.pdf` : 'fixed.pdf');
};
