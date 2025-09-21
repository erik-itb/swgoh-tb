import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Star,
  Users,
  Calendar,
  User,
  Shield,
  TrendingUp,
  Target,
  Play,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSquadStore } from '../store/squadStore';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/common/LoadingSpinner';
import { SquadUnitCard } from '../components/squads/SquadUnitCard';
import { MissionRecommendationCard } from '../components/squads/MissionRecommendationCard';
import { formatDistanceToNow } from 'date-fns';

export const SquadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentSquad,
    isLoading,
    error,
    loadSquad,
    deleteSquad,
    publishSquad
  } = useSquadStore();

  React.useEffect(() => {
    if (id) {
      loadSquad(parseInt(id));
    }
  }, [id, loadSquad]);

  const canEdit = user && currentSquad && (
    currentSquad.createdBy === user.id ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN'
  );

  const canPublish = user && currentSquad && !currentSquad.isPublished && (
    currentSquad.createdBy === user.id ||
    user.role === 'ADMIN' ||
    user.role === 'SUPER_ADMIN'
  );

  const handleDelete = async () => {
    if (!currentSquad || !window.confirm('Are you sure you want to delete this squad?')) {
      return;
    }

    try {
      await deleteSquad(currentSquad.id);
      navigate('/squads');
    } catch (error) {
      console.error('Failed to delete squad:', error);
    }
  };

  const handlePublish = async () => {
    if (!currentSquad || !window.confirm('Are you sure you want to publish this squad?')) {
      return;
    }

    try {
      await publishSquad(currentSquad.id);
    } catch (error) {
      console.error('Failed to publish squad:', error);
    }
  };

  if (isLoading) {
    return <LoadingOverlay>Loading squad details...</LoadingOverlay>;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Squad</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Link to="/squads" className="btn-primary">
            Back to Squads
          </Link>
        </div>
      </div>
    );
  }

  if (!currentSquad) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-400 mb-4">Squad Not Found</h2>
          <Link to="/squads" className="btn-primary">
            Back to Squads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/squads"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{currentSquad.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-neutral-400 capitalize">
                {currentSquad.squadType.replace('_', ' ')}
              </span>
              {currentSquad.isPublished ? (
                <span className="flex items-center space-x-1 text-green-400 text-sm">
                  <Eye size={16} />
                  <span>Published</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-neutral-500 text-sm">
                  <EyeOff size={16} />
                  <span>Draft</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2">
            {canPublish && (
              <button
                onClick={handlePublish}
                className="btn-secondary flex items-center space-x-2"
              >
                <Eye size={16} />
                <span>Publish</span>
              </button>
            )}
            <Link
              to={`/squads/${currentSquad.id}/edit`}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Edit</span>
            </Link>
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {currentSquad.description && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white">Description</h2>
              </div>
              <div className="card-content">
                <p className="text-neutral-300">{currentSquad.description}</p>
              </div>
            </div>
          )}

          {/* Squad Units */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Squad Composition</h2>
                <span className="text-sm text-neutral-400">
                  {currentSquad.units?.length || 0}/5 units
                </span>
              </div>
            </div>
            <div className="card-content">
              {currentSquad.units && currentSquad.units.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSquad.units.map((unit, index) => (
                    <SquadUnitCard key={index} unit={unit} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">No units added to this squad yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mission Recommendations */}
          {currentSquad.missionRecommendations && currentSquad.missionRecommendations.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white">Recommended Missions</h2>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {currentSquad.missionRecommendations.map((recommendation) => (
                    <MissionRecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Strategy Notes */}
          {currentSquad.strategyNotes && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white">Strategy Notes</h2>
              </div>
              <div className="card-content">
                <div className="prose prose-invert max-w-none">
                  <p className="text-neutral-300 whitespace-pre-wrap">
                    {currentSquad.strategyNotes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Squad Stats</h3>
            </div>
            <div className="card-content space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  <span className="text-neutral-400">Rating</span>
                </div>
                <span className="text-white font-medium">
                  {currentSquad.averageRating ? currentSquad.averageRating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <span className="text-neutral-400">Success Rate</span>
                </div>
                <span className="text-white font-medium">
                  {currentSquad.successRate ? `${currentSquad.successRate}%` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="text-neutral-400">Missions</span>
                </div>
                <span className="text-white font-medium">
                  {currentSquad.missionRecommendations?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Squad Info</h3>
            </div>
            <div className="card-content space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-400">Created by</p>
                  <p className="text-white font-medium">{currentSquad.createdBy}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-400">Created</p>
                  <p className="text-white font-medium">
                    {formatDistanceToNow(new Date(currentSquad.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {currentSquad.updatedAt !== currentSquad.createdAt && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Last updated</p>
                    <p className="text-white font-medium">
                      {formatDistanceToNow(new Date(currentSquad.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Strategy Video */}
          {currentSquad.strategyVideoUrl && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Strategy Video</h3>
              </div>
              <div className="card-content">
                <a
                  href={currentSquad.strategyVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Play size={20} />
                  <span>Watch Strategy Video</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};