export interface PdfPage {
  pageNumber: number;
  originalImage: string; // Base64
  processedImage: string | null; // Base64
  status: 'pending' | 'processing' | 'completed' | 'error';
  width: number;
  height: number;
  aspectRatio: number;
}

export type ImageQuality = '1K' | '2K' | '4K';

export interface ProcessingStats {
  total: number;
  processed: number;
  errors: number;
}

export interface AppState {
  file: File | null;
  pages: PdfPage[];
  isProcessing: boolean;
  quality: ImageQuality;
  isApiKeyReady: boolean;
}
