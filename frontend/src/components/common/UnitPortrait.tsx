import React, { useState, useEffect } from 'react';
import { assetService } from '../../services/asset.service';

export interface Unit {
  id: number;
  gameId: string;
  name: string;
  unitType: 'CHARACTER' | 'SHIP' | 'CAPITAL_SHIP';
  alignment: 'LIGHT_SIDE' | 'DARK_SIDE' | 'NEUTRAL';
  factions: string[];
  tags: string[];
  portraitUrl: string;
  iconUrl: string;
}

interface UnitPortraitProps {
  unit?: Unit;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  isLeader?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-20 h-20',
  xl: 'w-24 h-24'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base', 
  xl: 'text-lg'
};

export const UnitPortrait: React.FC<UnitPortraitProps> = ({
  unit,
  size = 'md',
  showName = false,
  isLeader = false,
  onClick,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [progressiveUrls, setProgressiveUrls] = useState<{
    placeholder: string;
    small: string;
    medium: string;
    large: string;
  } | null>(null);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Load assets using our asset service
  useEffect(() => {
    if (!unit?.gameId) {
      setAssetUrl(null);
      setProgressiveUrls(null);
      return;
    }

    const loadAssets = async () => {
      try {
        // Load portrait with size preference
        const portraitUrl = await assetService.getUnitPortrait(unit.gameId, size);
        setAssetUrl(portraitUrl);

        // Load progressive URLs for better UX
        const progressive = await assetService.getProgressiveImageUrls(unit.gameId);
        setProgressiveUrls(progressive);
      } catch (error) {
        console.error('Error loading unit assets:', error);
        setImageError(true);
      }
    };

    loadAssets();
  }, [unit?.gameId, size]);

  // Determine the best image URL to use
  const getImageUrl = () => {
    if (imageError) {
      return assetService.getFallbackPortrait();
    }

    // Use progressive loading if available
    if (progressiveUrls) {
      switch (size) {
        case 'sm': return progressiveUrls.small;
        case 'lg': case 'xl': return progressiveUrls.large;
        default: return progressiveUrls.medium;
      }
    }

    // Fallback to asset service URL or unit.portraitUrl
    return assetUrl || unit?.portraitUrl || assetService.getFallbackPortrait();
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'LIGHT_SIDE': return 'ring-blue-400';
      case 'DARK_SIDE': return 'ring-red-400';
      default: return 'ring-gray-400';
    }
  };

  const getUnitTypeIcon = (unitType: string) => {
    switch (unitType) {
      case 'SHIP': return '🚀';
      case 'CAPITAL_SHIP': return '🛸';
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <div 
          className={`
            ${sizeClasses[size]} 
            rounded-full 
            overflow-hidden 
            border-2 
            ${unit ? getAlignmentColor(unit.alignment) : 'border-gray-300'} 
            ${isLeader ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}
            ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
            ${!unit ? 'border-dashed bg-gray-100 hover:bg-gray-200' : ''}
            relative
          `}
          onClick={onClick}
        >
          {unit ? (
            <>
              {/* Loading spinner */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              {/* Unit portrait */}
              <img
                src={getImageUrl()}
                alt={unit.name}
                className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
              />
              
              {/* Unit type indicator */}
              {getUnitTypeIcon(unit.unitType) && (
                <div className="absolute top-0 right-0 text-xs bg-black bg-opacity-75 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {getUnitTypeIcon(unit.unitType)}
                </div>
              )}
              
              {/* Leader indicator */}
              {isLeader && (
                <div className="absolute bottom-0 left-0 bg-yellow-500 text-white text-xs px-1 rounded-tr">
                  L
                </div>
              )}
            </>
          ) : (
            /* Empty slot */
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          )}
        </div>
      </div>
      
      {/* Unit name */}
      {showName && unit && (
        <div className={`mt-1 text-center ${textSizeClasses[size]} text-gray-700 font-medium max-w-20 truncate`}>
          {unit.name}
        </div>
      )}
      
      {/* Position label for empty slots */}
      {showName && !unit && (
        <div className={`mt-1 text-center ${textSizeClasses[size]} text-gray-400`}>
          {isLeader ? 'Leader' : 'Member'}
        </div>
      )}
    </div>
  );
};