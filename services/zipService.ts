import JSZip from 'jszip';
import { PdfPage } from '../types';

/**
 * Packs all images from the pages array into a ZIP file and triggers a download.
 */
export const downloadAllAsZip = async (pages: PdfPage[], originalFileName: string): Promise<void> => {
  if (pages.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder("fixed_images");
  
  // Extract base name without extension for the prefix
  const baseNamePrefix = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "document";

  pages.forEach((page) => {
    // Priority: Processed Image > Original Image
    const imageData = page.processedImage || page.originalImage;
    
    // Extract base64 content
    // Format is usually data:image/jpeg;base64,xxxx
    const base64Parts = imageData.split(',');
    if (base64Parts.length < 2) return;

    const base64Data = base64Parts[1];
    const extension = imageData.includes('image/png') ? 'png' : 'jpg';
    
    // Filename format: [OriginalName]_page_[001].ext
    const fileName = `${baseNamePrefix}_page_${page.pageNumber.toString().padStart(3, '0')}.${extension}`;

    folder?.file(fileName, base64Data, { base64: true });
  });

  const content = await zip.generateAsync({ type: "blob" });
  
  // Create download link
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  
  const zipName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "fixed_document";
  link.download = `${zipName}_images.zip`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
};