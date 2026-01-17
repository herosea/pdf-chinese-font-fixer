
export interface PdfPage {
  id: string; // Unique ID for keying
  pageNumber: number;
  originalImage: string; // Base64
  processedImage: string | null; // Base64
  compressedImage: string | null; // Base64 (Compressed version of processed)
  status: 'pending' | 'processing' | 'completed' | 'error';
  width: number;
  height: number;
  aspectRatio: number;
  customPrompt?: string;
}

export type ImageQuality = '1K' | '2K' | '4K';
export type CompressionLevel = 'none' | 'low' | 'balanced' | 'high';

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
  compressionLevel: CompressionLevel;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  pages: PdfPage[];
  fileName: string;
  customPrompt: string;
  quality: ImageQuality;
  compressionLevel: CompressionLevel;
}

export type SessionMetadata = Omit<Session, 'pages'>;
