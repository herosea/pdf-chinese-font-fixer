
import PptxGenJS from 'pptxgenjs';
import { PdfPage } from '../types';

export const generatePptFromImages = async (pages: PdfPage[], originalFileName: string): Promise<void> => {
  if (pages.length === 0) return;
  const pptx = new PptxGenJS();
  const firstPage = pages[0];
  const layoutName = 'PDF_LAYOUT';
  pptx.defineLayout({ name: layoutName, width: firstPage.width / 72, height: firstPage.height / 72 });
  pptx.layout = layoutName;

  pages.forEach((page) => {
    const slide = pptx.addSlide();
    const imgData = page.compressedImage || page.processedImage || page.originalImage;
    slide.addImage({
      data: imgData,
      x: 0, y: 0, w: '100%', h: '100%',
      sizing: { type: 'contain', align: 'center' } 
    });
  });

  const outputName = originalFileName ? `${originalFileName.replace(/\.pdf$/i, '')}_fixed.pptx` : 'fixed.pptx';
  await pptx.writeFile({ fileName: outputName });
};
