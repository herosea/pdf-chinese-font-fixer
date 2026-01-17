
import PptxGenJS from 'pptxgenjs';
import { PdfPage } from '@/types';

export const generatePptFromImages = async (pages: PdfPage[], originalFileName: string): Promise<void> => {
  if (pages.length === 0) return;
  const pptx = new PptxGenJS();

  // PowerPoint has a maximum slide size limit (around 56 inches).
  // We need to calculate the layout size based on the first page,
  // but cap it to avoid generating corrupt PPTX files for high-res images.
  const firstPage = pages[0];

  // Default to 72 DPI for conversion from pixels to inches
  let layoutW = firstPage.width / 72;
  let layoutH = firstPage.height / 72;

  // Cap at 50 inches to be safe (max is ~56)
  const MAX_DIM = 50;
  if (layoutW > MAX_DIM || layoutH > MAX_DIM) {
    const scale = Math.min(MAX_DIM / layoutW, MAX_DIM / layoutH);
    layoutW *= scale;
    layoutH *= scale;
  }

  // Ensure minimum valid dimensions
  layoutW = Math.max(1, layoutW);
  layoutH = Math.max(1, layoutH);

  const layoutName = 'CUSTOM_PDF_LAYOUT';
  pptx.defineLayout({ name: layoutName, width: layoutW, height: layoutH });
  pptx.layout = layoutName;

  pages.forEach((page) => {
    const slide = pptx.addSlide();

    // Fallback logic: Compressed > Processed > Original
    const imgData = page.compressedImage || page.processedImage || page.originalImage;

    if (!imgData) return;

    try {
      slide.addImage({
        data: imgData,
        x: 0, y: 0, w: '100%', h: '100%',
        sizing: { type: 'contain', w: '100%', h: '100%' }
      });
    } catch (err) {
      console.warn(`Failed to add image for page ${page.pageNumber} to PPT`, err);
    }
  });

  // Sanitize filename
  let baseName = originalFileName || 'presentation';
  // Remove multiple extensions if present (e.g., .pdf.pptx)
  baseName = baseName.replace(/(\.pdf|\.pptx|\.ppt|\.zip)+$/i, '');
  // Remove _compressed or _fixed suffixes if we are adding them again
  baseName = baseName.replace(/(_修复版|_压缩版|_fixed|_compressed)+$/g, '');

  const suffix = originalFileName.match(/(_修复版|_压缩版|_fixed|_compressed)/) ? '' : '_fixed';
  const outputName = `${baseName}${suffix}.pptx`;

  await pptx.writeFile({ fileName: outputName });
};
