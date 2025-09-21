import React from 'react';
import { Star, Shield, Zap, Heart } from 'lucide-react';
import { SquadUnit } from '../../types';
import { cn } from '../../utils/helpers';

interface SquadUnitCardProps {
  unit: SquadUnit;
}

export const SquadUnitCard: React.FC<SquadUnitCardProps> = ({ unit }) => {
  const getRelicColor = (relicLevel: number) => {
    if (relicLevel >= 9) return 'text-purple-400 border-purple-500/30';
    if (relicLevel >= 7) return 'text-red-400 border-red-500/30';
    if (relicLevel >= 5) return 'text-amber-400 border-amber-500/30';
    if (relicLevel >= 3) return 'text-blue-400 border-blue-500/30';
    return 'text-green-400 border-green-500/30';
  };

  const getPositionIcon = (position: string) => {
    switch (position.toLowerCase()) {
      case 'leader': return '👑';
      case 'tank': return '🛡️';
      case 'damage': return '⚔️';
      case 'support': return '🎯';
      case 'healer': return '💚';
      default: return '⭐';
    }
  };

  const relicColorClass = getRelicColor(unit.requiredRelicLevel || 0);

  return (
    <div className={cn('card border transition-all duration-200', relicColorClass)}>
      <div className="card-content p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getPositionIcon(unit.position || 'damage')}</span>
            <div>
              <h3 className="text-sm font-semibold text-white">{unit.name}</h3>
              <p className="text-xs text-neutral-400 capitalize">{unit.position || 'damage'}</p>
            </div>
          </div>
          {unit.requiredRelicLevel && (
            <span className={cn(
              'text-xs px-2 py-1 rounded border',
              unit.requiredRelicLevel >= 9 ? 'bg-purple-900/20 text-purple-300 border-purple-500/30' :
              unit.requiredRelicLevel >= 7 ? 'bg-red-900/20 text-red-300 border-red-500/30' :
              unit.requiredRelicLevel >= 5 ? 'bg-amber-900/20 text-amber-300 border-amber-500/30' :
              unit.requiredRelicLevel >= 3 ? 'bg-blue-900/20 text-blue-300 border-blue-500/30' :
              'bg-green-900/20 text-green-300 border-green-500/30'
            )}>
              R{unit.requiredRelicLevel}
            </span>
          )}
        </div>

        {unit.notes && (
          <p className="text-xs text-neutral-400 mb-3 line-clamp-2">
            {unit.notes}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {unit.requiredStars && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-amber-400" />
              <span className="text-neutral-400">{unit.requiredStars}★</span>
            </div>
          )}
          {unit.requiredGearLevel && (
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-blue-400" />
              <span className="text-neutral-400">G{unit.requiredGearLevel}</span>
            </div>
          )}
          {unit.requiredZetas && unit.requiredZetas > 0 && (
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-neutral-400">{unit.requiredZetas} Zeta</span>
            </div>
          )}
          {unit.requiredOmicrons && unit.requiredOmicrons > 0 && (
            <div className="flex items-center space-x-1">
              <Heart className="h-3 w-3 text-red-400" />
              <span className="text-neutral-400">{unit.requiredOmicrons} Omi</span>
            </div>
          )}
        </div>

        {unit.alternativeUnits && unit.alternativeUnits.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-700">
            <p className="text-xs text-neutral-500 mb-1">Alternatives:</p>
            <div className="flex flex-wrap gap-1">
              {unit.alternativeUnits.slice(0, 2).map((alt, index) => (
                <span
                  key={index}
                  className="text-xs bg-neutral-800 px-1 py-0.5 rounded text-neutral-400"
                >
                  {alt}
                </span>
              ))}
              {unit.alternativeUnits.length > 2 && (
                <span className="text-xs text-neutral-500">
                  +{unit.alternativeUnits.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};