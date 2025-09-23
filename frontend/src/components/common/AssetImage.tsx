import React, { useState, useEffect } from 'react';

interface AssetImageProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  lazy?: boolean;
  progressive?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const AssetImage: React.FC<AssetImageProps> = ({
  src,
  fallbackSrc = '/assets/fallback/character-portrait.png',
  alt,
  className = '',
  size = 'md',
  lazy = true,
  progressive = false,
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);

  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!imageError) {
      setImageError(true);
      setCurrentSrc(fallbackSrc);

      const error = new Error(`Failed to load image: ${src}`);
      onError?.(error);
    } else {
      setImageLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'md': return 'w-12 h-12';
      case 'lg': return 'w-16 h-16';
      case 'xl': return 'w-20 h-20';
      default: return '';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Loading indicator */}
      {imageLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded ${getSizeClasses()}`}>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {/* Main image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`
          ${getSizeClasses()}
          object-cover
          rounded
          transition-opacity
          duration-300
          ${imageLoading ? 'opacity-0' : 'opacity-100'}
        `}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={lazy ? 'lazy' : 'eager'}
      />

      {/* Error state indicator */}
      {imageError && !imageLoading && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-white"
             title="Failed to load image" />
      )}
    </div>
  );
};

export default AssetImage;