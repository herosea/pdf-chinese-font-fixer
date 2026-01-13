
/**
 * Browser-side image compression utility
 */

export const compressImage = async (
  base64Str: string,
  quality: number = 0.7,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const compressedBase64 = canvas.toDataURL(format, quality);
      resolve(compressedBase64);
    };
    img.onerror = (e) => reject(e);
    img.src = base64Str;
  });
};

export const getCompressionRatio = (level: string): number => {
  switch (level) {
    case 'low': return 0.9;
    case 'balanced': return 0.6;
    case 'high': return 0.3;
    default: return 1.0;
  }
};
