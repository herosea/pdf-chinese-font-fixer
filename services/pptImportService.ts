
import JSZip from 'jszip';
import { PdfPage } from '../types';
import { getImageDimensions } from './pdfService';

/**
 * 将 Blob 转换为 Base64 字符串
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
};

/**
 * 解析文件名中的数字用于排序 (例如 image1.png, image10.png)
 */
const getFileIndex = (filename: string): number => {
  const match = filename.match(/image(\d+)\./i);
  return match ? parseInt(match[1], 10) : 9999;
};

export const extractImagesFromPpt = async (file: File): Promise<PdfPage[]> => {
  try {
    const zip = new JSZip();
    // 加载 pptx 文件 (本质是 zip)
    const content = await zip.loadAsync(file);
    
    // PPT 图片通常存储在 ppt/media/ 目录下
    const mediaFolder = content.folder("ppt/media");
    
    if (!mediaFolder) {
      throw new Error("此 PPT 文件中未找到 'ppt/media' 文件夹。");
    }

    const imageFiles: { name: string; data: string }[] = [];
    const promises: Promise<void>[] = [];

    // 遍历文件夹寻找图片
    mediaFolder.forEach((relativePath, zipEntry) => {
      // 过滤常见图片格式
      if (relativePath.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i)) {
        const promise = async () => {
          const blob = await zipEntry.async("blob");
          const base64 = await blobToBase64(blob);
          imageFiles.push({
            name: relativePath,
            data: base64
          });
        };
        promises.push(promise());
      }
    });

    await Promise.all(promises);

    if (imageFiles.length === 0) {
      return [];
    }

    // 尝试按 image1, image2 的顺序排序
    // 注意：PPT 内部图片编号不一定完全对应幻灯片顺序，但在提取素材场景下通常足够
    imageFiles.sort((a, b) => getFileIndex(a.name) - getFileIndex(b.name));

    const pages: PdfPage[] = [];

    // 构建 PdfPage 对象
    for (let i = 0; i < imageFiles.length; i++) {
      const base64 = imageFiles[i].data;
      const { width, height } = await getImageDimensions(base64);
      
      pages.push({
        id: crypto.randomUUID(),
        pageNumber: i + 1,
        originalImage: base64,
        processedImage: null,
        compressedImage: null,
        status: 'pending',
        width,
        height,
        aspectRatio: width / height,
        customPrompt: ''
      });
    }

    return pages;

  } catch (error) {
    console.error("PPT 解析失败:", error);
    throw new Error("无法解析 PPTX 文件，请确认文件未损坏且包含图片。");
  }
};
