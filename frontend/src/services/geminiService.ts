
import { filesApi } from "./api";
import { ImageQuality } from "../types";

// Utility to remove invisible characters that cause rendering artifacts
export const cleanHiddenChars = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\ufffc/g, '') // Object Replacement Character
    .replace(/\ufffd/g, '') // Replacement Character
    .replace(/\u200b/g, '') // Zero Width Space
    .replace(/\ufeff/g, '') // Byte Order Mark
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ''); // Control chars
};

// Helper: Convert Base64 (data URL) to File object
const base64ToFile = async (base64: string, filename: string = 'image.png'): Promise<File> => {
  const res = await fetch(base64);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

/**
 * Enhances a page image using the Backend API.
 * Uploads the image, requests processing, and downloads the result.
 */
export const enhancePageImage = async (
  base64Image: string,
  quality: ImageQuality = '4K',
  // aspectRatio removed as it's not used by backend
  signal?: AbortSignal,
  customPrompt?: string
): Promise<string> => {
  try {
    // 1. Upload
    // Generate a temporary filename
    const filename = `page_${Date.now()}.png`;
    const file = await base64ToFile(base64Image, filename);

    // Check for abort before upload
    if (signal?.aborted) throw new Error("Aborted");

    const uploadRes = await filesApi.upload(file);
    const fileId = uploadRes.file_id;

    // Check for abort
    if (signal?.aborted) throw new Error("Aborted");

    // 2. Process
    // Note: Backend 'process' handles one file at a time currently, so we pass pages=[0] 
    // because we uploaded a single image file.
    await filesApi.process(fileId, [0], quality, customPrompt);

    // Check for abort
    if (signal?.aborted) throw new Error("Aborted");

    // 3. Download Result
    // The download endpoint returns { page: 0, image: "data:..." }
    const result = await filesApi.download(fileId, 0);

    if (result && result.image) {
      return result.image;
    } else {
      throw new Error("Failed to retrieve processed image");
    }

  } catch (error: any) {
    if (signal?.aborted) {
      throw new Error("Aborted");
    }
    console.error("Enhance Page Error:", error);
    // Preserving error structure for UI handling
    const msg = error.response?.data?.detail || error.message || "Processing failed";
    throw new Error(msg);
  }
};

/**
 * Extracts text from a page image using the Backend API.
 */
export const extractTextFromPage = async (base64Image: string): Promise<string> => {
  try {
    // 1. Upload
    const filename = `ocr_${Date.now()}.png`;
    const file = await base64ToFile(base64Image, filename);
    const uploadRes = await filesApi.upload(file);
    const fileId = uploadRes.file_id;

    // 2. Request OCR
    const ocrRes = await filesApi.extractText(fileId, [0]);

    return cleanHiddenChars(ocrRes.text || "");
  } catch (error: any) {
    console.error("OCR Error:", error);
    // Return empty string on error to not block UI flows that depend on this but can survive without it
    return "";
  }
};
