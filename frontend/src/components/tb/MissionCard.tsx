import React from 'react';
import { Link } from 'react-router-dom';
import {
  Swords,
  Shield,
  Star,
  Users,
  Clock,
  Target,
  Play,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { CombatMission } from '../../types';
import { cn } from '../../utils/helpers';

interface MissionCardProps {
  mission: CombatMission;
  tbSlug: string;
  phaseId: number;
  planetId: number;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  tbSlug,
  phaseId,
  planetId
}) => {
  const getMissionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'combat': return Swords;
      case 'special': return Shield;
      case 'fleet': return Target;
      default: return Swords;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'border-green-500/30 bg-green-900/10';
      case 'medium': return 'border-amber-500/30 bg-amber-900/10';
      case 'hard': return 'border-red-500/30 bg-red-900/10';
      case 'extreme': return 'border-purple-500/30 bg-purple-900/10';
      default: return 'border-blue-500/30 bg-blue-900/10';
    }
  };

  const Icon = getMissionTypeIcon(mission.missionType);
  const difficultyClass = getDifficultyColor(mission.difficulty);

  return (
    <div className={cn('card', difficultyClass)}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">{mission.name}</h3>
              <p className="text-sm text-neutral-400">
                {mission.missionType} • Wave {mission.waveNumber}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              'text-xs px-2 py-1 rounded',
              mission.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
              mission.difficulty === 'medium' ? 'bg-amber-900 text-amber-300' :
              mission.difficulty === 'hard' ? 'bg-red-900 text-red-300' :
              mission.difficulty === 'extreme' ? 'bg-purple-900 text-purple-300' :
              'bg-neutral-700 text-neutral-300'
            )}>
              {mission.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="card-content">
        {mission.description && (
          <p className="text-neutral-300 text-sm mb-4">{mission.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-neutral-400">Max Stars:</span>
            <span className="text-white font-medium">{mission.maxStars}</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-neutral-400">Territory Points:</span>
            <span className="text-white font-medium">{mission.territoryPoints?.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-neutral-400">Squads:</span>
            <span className="text-white font-medium">{mission.recommendedSquads?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-neutral-400" />
            <span className="text-neutral-400">Attempts:</span>
            <span className="text-white font-medium">{mission.attempts || 1}</span>
          </div>
        </div>

        {mission.enemyDescription && (
          <div className="mb-4 p-3 bg-neutral-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-neutral-300">Enemy Forces</span>
            </div>
            <p className="text-xs text-neutral-400">{mission.enemyDescription}</p>
          </div>
        )}

        {mission.modifiers && mission.modifiers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-neutral-300">Modifiers</span>
            </div>
            <div className="space-y-1">
              {mission.modifiers.slice(0, 2).map((modifier, index) => (
                <div key={index} className="text-xs bg-neutral-800 px-2 py-1 rounded">
                  {modifier}
                </div>
              ))}
              {mission.modifiers.length > 2 && (
                <div className="text-xs text-neutral-500">
                  +{mission.modifiers.length - 2} more modifiers
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 mb-4">
          {[...Array(mission.maxStars)].map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 text-amber-400 fill-current"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to={`/mission/${tbSlug}/${phaseId}/${planetId}/${mission.id}`}
            className="btn-primary text-sm flex items-center justify-center space-x-2"
          >
            <BookOpen size={16} />
            <span>View Details</span>
          </Link>

          {mission.recommendedSquads && mission.recommendedSquads.length > 0 && (
            <Link
              to={`/mission/${tbSlug}/${phaseId}/${planetId}/${mission.id}/squads`}
              className="btn-secondary text-sm flex items-center justify-center space-x-2"
            >
              <Users size={16} />
              <span>Squad Recommendations</span>
            </Link>
          )}
        </div>

        {mission.strategyVideoUrl && (
          <div className="mt-3">
            <a
              href={mission.strategyVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-outline text-sm flex items-center justify-center space-x-2 hover:bg-red-900/20 hover:border-red-500/50"
            >
              <Play size={16} />
              <span>Strategy Video</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};