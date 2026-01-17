import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, title, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (imageUrl) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Header controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none z-10">
        <div className="bg-gray-900/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10 shadow-lg">
          {title || t('preview.defaultTitle')}
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10 backdrop-blur-md"
          aria-label={t('preview.close')}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image */}
      <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
        <img
          src={imageUrl}
          alt={title || "Preview"}
          className="max-w-full max-h-full object-contain shadow-2xl rounded select-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;