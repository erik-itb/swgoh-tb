import React, { useState, useEffect } from 'react';
import { UnitPortrait, Unit } from './UnitPortrait';
import UnitIcon from './UnitIcon';
import { assetService } from '../../services/asset.service';

interface Squad {
  id: number;
  name: string;
  units: SquadUnit[];
  totalPower?: number;
  effectiveness?: number;
}

interface SquadUnit {
  position: number;
  isLeader: boolean;
  unit: Unit;
}

interface SquadDisplayProps {
  squad: Squad;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'grid' | 'compact';
  showNames?: boolean;
  showIcons?: boolean;
  preloadAssets?: boolean;
  onClick?: () => void;
  className?: string;
}

const SquadDisplay: React.FC<SquadDisplayProps> = ({
  squad,
  size = 'md',
  layout = 'horizontal',
  showNames = false,
  showIcons = false,
  preloadAssets = true,
  onClick,
  className = ''
}) => {
  const [assetsPreloaded, setAssetsPreloaded] = useState(false);

  // Preload assets for better performance
  useEffect(() => {
    if (preloadAssets && squad.units?.length > 0) {
      const preloadSquadAssets = async () => {
        try {
          const gameIds = squad.units.map(su => su.unit.gameId);
          await assetService.preloadAssets(gameIds);
          setAssetsPreloaded(true);
        } catch (error) {
          console.error('Error preloading squad assets:', error);
        }
      };

      preloadSquadAssets();
    }
  }, [squad.units, preloadAssets]);

  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-3 gap-2';
      case 'compact':
        return 'flex flex-wrap gap-1';
      default:
        return 'flex gap-2';
    }
  };

  const getContainerClasses = () => {
    const baseClasses = `
      relative
      ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
      ${className}
    `;

    switch (layout) {
      case 'grid':
        return `${baseClasses} p-4 bg-white rounded-lg border`;
      case 'compact':
        return `${baseClasses} p-2 bg-gray-50 rounded`;
      default:
        return `${baseClasses} p-3 bg-white rounded-lg border`;
    }
  };

  // Sort units by position (leader first)
  const sortedUnits = [...(squad.units || [])].sort((a, b) => {
    if (a.isLeader && !b.isLeader) return -1;
    if (!a.isLeader && b.isLeader) return 1;
    return a.position - b.position;
  });

  return (
    <div className={getContainerClasses()} onClick={onClick}>
      {/* Squad header */}
      <div className="mb-2">
        <h3 className={`font-semibold text-gray-800 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
          {squad.name}
        </h3>

        {/* Squad stats */}
        <div className="flex gap-3 text-xs text-gray-600 mt-1">
          {squad.totalPower && (
            <span>Power: {squad.totalPower.toLocaleString()}</span>
          )}
          {squad.effectiveness && (
            <span>Effectiveness: {(squad.effectiveness * 100).toFixed(0)}%</span>
          )}
          {preloadAssets && !assetsPreloaded && (
            <span className="text-blue-600">Loading assets...</span>
          )}
        </div>
      </div>

      {/* Units display */}
      <div className={getLayoutClasses()}>
        {sortedUnits.map((squadUnit) => (
          <div key={`${squad.id}-${squadUnit.unit.gameId}-${squadUnit.position}`} className="relative">
            {/* Main unit portrait */}
            <UnitPortrait
              unit={squadUnit.unit}
              size={size}
              showName={showNames}
              isLeader={squadUnit.isLeader}
            />

            {/* Unit icon overlay (for compact view) */}
            {showIcons && layout === 'compact' && (
              <div className="absolute -top-1 -right-1">
                <UnitIcon
                  gameId={squadUnit.unit.gameId}
                  name={squadUnit.unit.name}
                  size="sm"
                />
              </div>
            )}

            {/* Position indicator */}
            {layout !== 'compact' && (
              <div className="absolute bottom-0 right-0 bg-gray-800 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {squadUnit.position}
              </div>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {sortedUnits.length < 5 && layout !== 'compact' && (
          <>
            {Array.from({ length: 5 - sortedUnits.length }, (_, index) => (
              <div key={`empty-${index}`}>
                <UnitPortrait
                  size={size}
                  showName={showNames}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Squad actions (if clickable) */}
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default SquadDisplay;