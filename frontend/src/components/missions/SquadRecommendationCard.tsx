import React from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Users,
  TrendingUp,
  Eye,
  User,
  Calendar,
  Target,
  Play
} from 'lucide-react';
import { Squad } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/helpers';

interface SquadRecommendationCardProps {
  squad: Squad;
  missionId: number;
}

export const SquadRecommendationCard: React.FC<SquadRecommendationCardProps> = ({
  squad,
  missionId
}) => {
  const getSquadTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'galactic_republic':
        return 'border-blue-500/30 bg-blue-900/10';
      case 'separatists':
        return 'border-red-500/30 bg-red-900/10';
      case 'rebel_alliance':
        return 'border-orange-500/30 bg-orange-900/10';
      case 'empire':
        return 'border-gray-500/30 bg-gray-900/10';
      case 'first_order':
        return 'border-red-600/30 bg-red-900/10';
      case 'resistance':
        return 'border-orange-600/30 bg-orange-900/10';
      case 'jedi':
        return 'border-blue-400/30 bg-blue-900/10';
      case 'sith':
        return 'border-red-700/30 bg-red-900/10';
      case 'scoundrels':
        return 'border-yellow-500/30 bg-yellow-900/10';
      case 'bounty_hunters':
        return 'border-green-500/30 bg-green-900/10';
      default:
        return 'border-neutral-500/30 bg-neutral-900/10';
    }
  };

  const typeClass = getSquadTypeColor(squad.squadType);

  // Find the mission recommendation for this specific mission
  const missionRec = squad.missionRecommendations?.find(
    rec => rec.mission.id === missionId
  );

  return (
    <div className={cn('card hover:border-opacity-70 transition-all duration-200', typeClass)}>
      <div className="card-header">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{squad.name}</h3>
            <p className="text-sm text-neutral-400 capitalize">
              {squad.squadType.replace('_', ' ')}
            </p>
          </div>
          {missionRec && (
            <span className={cn(
              'text-xs px-2 py-1 rounded border',
              missionRec.priority === 'high' ? 'bg-red-900/20 text-red-300 border-red-500/30' :
              missionRec.priority === 'medium' ? 'bg-amber-900/20 text-amber-300 border-amber-500/30' :
              'bg-green-900/20 text-green-300 border-green-500/30'
            )}>
              {missionRec.priority} priority
            </span>
          )}
        </div>
      </div>

      <div className="card-content">
        {squad.description && (
          <p className="text-neutral-300 text-sm mb-4 line-clamp-2">{squad.description}</p>
        )}

        {missionRec?.notes && (
          <div className="mb-4 p-3 bg-neutral-800 rounded-lg border border-blue-500/20">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Mission-Specific Notes</span>
            </div>
            <p className="text-xs text-neutral-300">{missionRec.notes}</p>
          </div>
        )}

        {/* Squad Units Preview */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-neutral-300">Squad Composition</span>
            <span className="text-xs text-neutral-500">({squad.units?.length || 0}/5)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {squad.units?.slice(0, 5).map((unit, index) => (
              <span
                key={index}
                className={cn(
                  'text-xs px-2 py-1 rounded text-neutral-300',
                  unit.position === 'leader' ? 'bg-amber-900/30 border border-amber-500/30' :
                  unit.position === 'tank' ? 'bg-blue-900/30 border border-blue-500/30' :
                  'bg-neutral-800'
                )}
              >
                {unit.position === 'leader' && '👑 '}{unit.name}
              </span>
            ))}
            {squad.units && squad.units.length > 5 && (
              <span className="text-xs text-neutral-500">
                +{squad.units.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-sm mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-neutral-400 text-xs">Rating</span>
            </div>
            <span className="text-white font-medium">
              {squad.averageRating ? squad.averageRating.toFixed(1) : 'N/A'}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-neutral-400 text-xs">Success</span>
            </div>
            <span className="text-white font-medium">
              {missionRec?.successRate ? `${missionRec.successRate}%` :
               squad.successRate ? `${squad.successRate}%` : 'N/A'}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <User className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-400 text-xs">Author</span>
            </div>
            <span className="text-white font-medium text-xs">{squad.createdBy}</span>
          </div>
        </div>

        {/* Key Requirements */}
        {squad.units && squad.units.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-neutral-300 mb-2">Key Requirements</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-neutral-800 px-2 py-1 rounded">
                Min Relic: R{Math.min(...squad.units.filter(u => u.requiredRelicLevel).map(u => u.requiredRelicLevel!))}
              </div>
              <div className="bg-neutral-800 px-2 py-1 rounded">
                Total Zetas: {squad.units.reduce((sum, u) => sum + (u.requiredZetas || 0), 0)}
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar size={12} />
            <span>{formatDistanceToNow(new Date(squad.createdAt), { addSuffix: true })}</span>
          </div>
          {squad.updatedAt !== squad.createdAt && (
            <span>Updated {formatDistanceToNow(new Date(squad.updatedAt), { addSuffix: true })}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link
            to={`/squads/${squad.id}`}
            className="flex-1 btn-primary text-sm flex items-center justify-center space-x-2"
          >
            <Eye size={16} />
            <span>View Details</span>
          </Link>
          {squad.strategyVideoUrl && (
            <a
              href={squad.strategyVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm p-2"
              title="Strategy Video"
            >
              <Play className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};