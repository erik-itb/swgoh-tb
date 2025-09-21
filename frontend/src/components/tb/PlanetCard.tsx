import React from 'react';
import { Globe, Swords, Shield, Star, TrendingUp } from 'lucide-react';
import { Planet } from '../../types';
import { cn } from '../../utils/helpers';

interface PlanetCardProps {
  planet: Planet;
  onClick: () => void;
}

export const PlanetCard: React.FC<PlanetCardProps> = ({ planet, onClick }) => {
  const getPlanetTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'desert': return '🏜️';
      case 'forest': return '🌲';
      case 'ice': return '❄️';
      case 'urban': return '🏙️';
      case 'space': return '🌌';
      case 'volcanic': return '🌋';
      default: return '🪐';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 border-green-500/30';
      case 'medium': return 'text-amber-400 border-amber-500/30';
      case 'hard': return 'text-red-400 border-red-500/30';
      case 'extreme': return 'text-purple-400 border-purple-500/30';
      default: return 'text-blue-400 border-blue-500/30';
    }
  };

  const difficultyColor = getDifficultyColor(planet.difficulty || 'medium');

  return (
    <div
      onClick={onClick}
      className={cn(
        'card hover:border-opacity-70 cursor-pointer transition-all duration-200',
        difficultyColor
      )}
    >
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getPlanetTypeIcon(planet.planetType || 'default')}</div>
            <div>
              <h3 className="text-lg font-semibold text-white">{planet.name}</h3>
              <p className="text-sm text-neutral-400">{planet.planetType}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              'text-xs px-2 py-1 rounded',
              planet.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
              planet.difficulty === 'medium' ? 'bg-amber-900 text-amber-300' :
              planet.difficulty === 'hard' ? 'bg-red-900 text-red-300' :
              planet.difficulty === 'extreme' ? 'bg-purple-900 text-purple-300' :
              'bg-neutral-700 text-neutral-300'
            )}>
              {planet.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="card-content">
        {planet.description && (
          <p className="text-neutral-300 text-sm mb-4">{planet.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center space-x-2">
            <Swords className="h-4 w-4 text-red-400" />
            <span className="text-neutral-400">Combat:</span>
            <span className="text-white font-medium">{planet.totalCombatMissions}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-neutral-400">Special:</span>
            <span className="text-white font-medium">{planet.totalSpecialMissions}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-neutral-400">Max Stars:</span>
            <span className="text-white font-medium">{planet.maxStars}</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-neutral-400">Territory Points:</span>
            <span className="text-white font-medium">{planet.territoryPoints?.toLocaleString()}</span>
          </div>
        </div>

        {planet.strategyTips && (
          <div className="mt-4 p-3 bg-neutral-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-300">Strategy Tips</span>
            </div>
            <p className="text-xs text-neutral-400">{planet.strategyTips}</p>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-neutral-500">
            {planet.totalCombatMissions + planet.totalSpecialMissions} total missions
          </span>
          <div className="flex items-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < (planet.maxStars || 0) ? 'text-amber-400 fill-current' : 'text-neutral-600'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};