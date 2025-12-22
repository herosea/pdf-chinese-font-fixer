import PptxGenJS from 'pptxgenjs';
import { PdfPage } from '../types';

export const generatePptFromImages = async (pages: PdfPage[], originalFileName: string): Promise<void> => {
  if (pages.length === 0) return;

  const pptx = new PptxGenJS();
  
  // Use the first page to define the presentation layout
  // PDF viewport dimensions are typically in points (1/72 inch). 
  // PptxGenJS measures in inches by default.
  const firstPage = pages[0];
  const widthInches = firstPage.width / 72;
  const heightInches = firstPage.height / 72;
  
  // Define a custom layout matching the PDF page aspect ratio
  const layoutName = 'PDF_LAYOUT';
  pptx.defineLayout({ name: layoutName, width: widthInches, height: heightInches });
  pptx.layout = layoutName;

  pages.forEach((page) => {
    const slide = pptx.addSlide();
    
    // Use processed image if available, otherwise fallback to original
    const imgData = page.processedImage || page.originalImage;
    
    // Add the image to the slide, stretching to fit the layout we defined
    // We use 'contain' sizing to ensure the whole image is visible without distortion,
    // though with our custom layout it should fit perfectly.
    slide.addImage({
      data: imgData,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      sizing: { type: 'contain', align: 'center' } 
    });
  });

  // Construct filename
  let outputName = 'fixed-document.pptx';
  if (originalFileName) {
    const nameWithoutExt = originalFileName.replace(/\.pdf$/i, '');
    outputName = `${nameWithoutExt}_fixed.pptx`;
  }

  await pptx.writeFile({ fileName: outputName });
};