import React, { useState, useEffect } from 'react';
import { assetService } from '../../services/asset.service';
import AssetImage from './AssetImage';

interface UnitIconProps {
  gameId: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10'
};

const UnitIcon: React.FC<UnitIconProps> = ({
  gameId,
  name,
  size = 'md',
  className = '',
  showTooltip = true,
  onClick
}) => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        setLoading(true);
        const url = await assetService.getUnitIcon(gameId);
        setIconUrl(url);
      } catch (error) {
        console.error('Error loading unit icon:', error);
        setIconUrl(assetService.getFallbackIcon());
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      loadIcon();
    }
  }, [gameId]);

  const handleError = (error: Error) => {
    console.error('Unit icon load error:', error);
    setIconUrl(assetService.getFallbackIcon());
  };

  return (
    <div
      className={`
        relative inline-block
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
        ${className}
      `}
      onClick={onClick}
      title={showTooltip && name ? name : undefined}
    >
      {loading ? (
        <div className={`${sizeClasses[size]} bg-gray-200 rounded animate-pulse`} />
      ) : (
        <AssetImage
          src={iconUrl || undefined}
          fallbackSrc={assetService.getFallbackIcon()}
          alt={name || `Unit ${gameId}`}
          size={size}
          className="rounded"
          onError={handleError}
        />
      )}
    </div>
  );
};

export default UnitIcon;