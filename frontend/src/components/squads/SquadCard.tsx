import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Star,
  Calendar,
  User,
  Eye,
  Edit,
  Shield,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { Squad } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/helpers';

interface SquadCardProps {
  squad: Squad;
}

export const SquadCard: React.FC<SquadCardProps> = ({ squad }) => {
  const { user } = useAuthStore();

  const canEdit = user && (
    squad.createdBy === user.id ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN'
  );

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
          <div className="flex items-center space-x-2">
            {squad.isPublished ? (
              <span className="flex items-center space-x-1 text-green-400 text-xs">
                <CheckCircle size={12} />
                <span>Published</span>
              </span>
            ) : (
              <span className="text-neutral-500 text-xs">Draft</span>
            )}
            {canEdit && (
              <Link
                to={`/squads/${squad.id}/edit`}
                className="p-1 hover:bg-neutral-700 rounded transition-colors"
              >
                <Edit size={14} className="text-neutral-400" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="card-content">
        {squad.description && (
          <p className="text-neutral-300 text-sm mb-4 line-clamp-2">{squad.description}</p>
        )}

        {/* Squad Units Preview */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-neutral-300">Units</span>
            <span className="text-xs text-neutral-500">({squad.units?.length || 0}/5)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {squad.units?.slice(0, 5).map((unit, index) => (
              <span
                key={index}
                className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300"
              >
                {unit.name}
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
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-neutral-400">Rating:</span>
            <span className="text-white font-medium">
              {squad.averageRating ? squad.averageRating.toFixed(1) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-neutral-400">Success:</span>
            <span className="text-white font-medium">
              {squad.successRate ? `${squad.successRate}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Mission Context */}
        {squad.missionRecommendations && squad.missionRecommendations.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-neutral-300">Recommended For</span>
            </div>
            <div className="space-y-1">
              {squad.missionRecommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-xs bg-neutral-800 px-2 py-1 rounded">
                  Phase {rec.mission.phase.phaseNumber} - {rec.mission.name}
                </div>
              ))}
              {squad.missionRecommendations.length > 2 && (
                <div className="text-xs text-neutral-500">
                  +{squad.missionRecommendations.length - 2} more missions
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <User size={12} />
            <span>{squad.createdBy}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={12} />
            <span>{formatDistanceToNow(new Date(squad.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-2">
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
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};