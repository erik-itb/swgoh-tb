import React, { useState, useEffect } from 'react';
import { assetService } from '../../services/asset.service';

interface AssetPreloaderProps {
  gameIds: string[];
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
  onError?: (errors: string[]) => void;
  children?: React.ReactNode;
  showProgress?: boolean;
}

const AssetPreloader: React.FC<AssetPreloaderProps> = ({
  gameIds,
  onProgress,
  onComplete,
  onError,
  children,
  showProgress = false
}) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (gameIds.length === 0) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const preloadAssets = async () => {
      setIsLoading(true);
      setLoadedCount(0);
      setTotalCount(gameIds.length);
      setErrors([]);
      setIsComplete(false);

      const loadErrors: string[] = [];

      try {
        // Preload assets with progress tracking
        await assetService.preloadAssets(gameIds);

        // Track individual asset loading
        let loaded = 0;
        for (const gameId of gameIds) {
          try {
            await Promise.all([
              assetService.getUnitPortrait(gameId),
              assetService.getUnitIcon(gameId)
            ]);
            loaded++;
            setLoadedCount(loaded);
            onProgress?.(loaded, gameIds.length);
          } catch (error) {
            loadErrors.push(`Failed to load assets for ${gameId}: ${error.message}`);
          }
        }

        if (loadErrors.length > 0) {
          setErrors(loadErrors);
          onError?.(loadErrors);
        }

        setIsComplete(true);
        onComplete?.();
      } catch (error) {
        console.error('Error preloading assets:', error);
        loadErrors.push(`General preload error: ${error.message}`);
        setErrors(loadErrors);
        onError?.(loadErrors);
      } finally {
        setIsLoading(false);
      }
    };

    preloadAssets();
  }, [gameIds, onProgress, onComplete, onError]);

  const progressPercentage = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  if (!showProgress) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Progress indicator */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Loading Assets...
            </span>
            <span className="text-sm text-blue-600">
              {loadedCount} / {totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Percentage */}
          <div className="text-right text-xs text-blue-600 mt-1">
            {progressPercentage.toFixed(0)}%
          </div>
        </div>
      )}

      {/* Error display */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm font-medium text-red-800 mb-2">
            Asset Loading Errors ({errors.length})
          </div>
          <div className="text-xs text-red-600 space-y-1 max-h-24 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Success indicator */}
      {isComplete && !isLoading && errors.length === 0 && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          ✅ All assets loaded successfully
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
};

export default AssetPreloader;