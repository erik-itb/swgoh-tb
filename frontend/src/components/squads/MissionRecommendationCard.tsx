import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Target,
  Star,
  TrendingUp,
  ExternalLink,
  Shield,
  Users
} from 'lucide-react';
import { MissionRecommendation } from '../../types';
import { cn } from '../../utils/helpers';

interface MissionRecommendationCardProps {
  recommendation: MissionRecommendation;
}

export const MissionRecommendationCard: React.FC<MissionRecommendationCardProps> = ({
  recommendation
}) => {
  const { mission } = recommendation;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 border-green-500/30 bg-green-900/10';
      case 'medium': return 'text-amber-400 border-amber-500/30 bg-amber-900/10';
      case 'hard': return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'extreme': return 'text-purple-400 border-purple-500/30 bg-purple-900/10';
      default: return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-900/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-amber-900/20 text-amber-300 border-amber-500/30';
      case 'low': return 'bg-green-900/20 text-green-300 border-green-500/30';
      default: return 'bg-neutral-700 text-neutral-300';
    }
  };

  const difficultyClass = getDifficultyColor(mission.difficulty);
  const priorityClass = getPriorityColor(recommendation.priority);

  return (
    <div className={cn('card border hover:border-opacity-70 transition-all duration-200', difficultyClass)}>
      <div className="card-content p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">{mission.name}</h3>
            </div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <MapPin className="h-3 w-3" />
              <span>Phase {mission.phase.phaseNumber}</span>
              <span>•</span>
              <span>{mission.planet.name}</span>
              <span>•</span>
              <span>Wave {mission.waveNumber}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={cn('text-xs px-2 py-1 rounded border', priorityClass)}>
              {recommendation.priority} Priority
            </span>
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

        {recommendation.notes && (
          <p className="text-xs text-neutral-300 mb-3 line-clamp-2">
            {recommendation.notes}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-amber-400" />
            <span className="text-neutral-400">Max {mission.maxStars}★</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <span className="text-neutral-400">{mission.territoryPoints?.toLocaleString()} TP</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-blue-400" />
            <span className="text-neutral-400">{mission.recommendedSquads?.length || 0} squads</span>
          </div>
        </div>

        {recommendation.successRate && (
          <div className="mb-3 p-2 bg-neutral-800 rounded">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Success Rate with this squad:</span>
              <span className="text-green-400 font-medium">{recommendation.successRate}%</span>
            </div>
          </div>
        )}

        {mission.modifiers && mission.modifiers.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-1 mb-1">
              <Shield className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-medium text-neutral-300">Key Modifiers</span>
            </div>
            <div className="space-y-1">
              {mission.modifiers.slice(0, 2).map((modifier, index) => (
                <div
                  key={index}
                  className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-400"
                >
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {[...Array(mission.maxStars)].map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3 text-amber-400 fill-current"
              />
            ))}
          </div>
          <Link
            to={`/mission/${mission.territoryBattle.slug}/${mission.phase.id}/${mission.planet.id}/${mission.id}`}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
          >
            <span>View Mission</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};