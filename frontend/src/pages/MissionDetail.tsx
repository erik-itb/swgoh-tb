import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Star,
  Shield,
  Users,
  Play,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useTBStore } from '../store/tbStore';
import { useSquadStore } from '../store/squadStore';
import { LoadingOverlay } from '../components/common/LoadingSpinner';
import { SquadRecommendationCard } from '../components/missions/SquadRecommendationCard';
import { WaveBreakdown } from '../components/missions/WaveBreakdown';
import { cn } from '../utils/helpers';

export const MissionDetail: React.FC = () => {
  const { tbSlug, phaseId, planetId, missionId } = useParams<{
    tbSlug: string;
    phaseId: string;
    planetId: string;
    missionId: string;
  }>();
  const location = useLocation();
  const { currentMission, loadMission, isLoading: tbLoading, error: tbError } = useTBStore();
  const { squads, loadSquads, isLoading: squadLoading } = useSquadStore();

  const showSquads = location.pathname.endsWith('/squads');

  React.useEffect(() => {
    if (missionId) {
      loadMission(parseInt(missionId));
    }
  }, [missionId, loadMission]);

  React.useEffect(() => {
    if (showSquads && missionId) {
      // Load squads recommended for this mission
      loadSquads({
        page: 1,
        limit: 20,
        missionId: parseInt(missionId),
        published: true
      });
    }
  }, [showSquads, missionId, loadSquads]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 border-green-500/30 bg-green-900/10';
      case 'medium': return 'text-amber-400 border-amber-500/30 bg-amber-900/10';
      case 'hard': return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'extreme': return 'text-purple-400 border-purple-500/30 bg-purple-900/10';
      default: return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
    }
  };

  if (tbLoading) {
    return <LoadingOverlay>Loading mission details...</LoadingOverlay>;
  }

  if (tbError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Mission</h2>
          <p className="text-neutral-400 mb-6">{tbError}</p>
          <Link to={`/tb/${tbSlug}`} className="btn-primary">
            Back to Territory Battle
          </Link>
        </div>
      </div>
    );
  }

  if (!currentMission) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-400 mb-4">Mission Not Found</h2>
          <Link to={`/tb/${tbSlug}`} className="btn-primary">
            Back to Territory Battle
          </Link>
        </div>
      </div>
    );
  }

  const difficultyClass = getDifficultyColor(currentMission.difficulty);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-neutral-400 mb-8">
        <Link to="/" className="hover:text-white transition-colors">
          Territory Battles
        </Link>
        <span>/</span>
        <Link to={`/tb/${tbSlug}`} className="hover:text-white transition-colors">
          {currentMission.territoryBattle.name}
        </Link>
        <span>/</span>
        <span>Phase {currentMission.phase.phaseNumber}</span>
        <span>/</span>
        <span>{currentMission.planet.name}</span>
        <span>/</span>
        <span className="text-white">{currentMission.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to={`/tb/${tbSlug}`}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Target className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">{currentMission.name}</h1>
              <span className={cn(
                'text-sm px-3 py-1 rounded border',
                currentMission.difficulty === 'easy' ? 'bg-green-900/20 text-green-300 border-green-500/30' :
                currentMission.difficulty === 'medium' ? 'bg-amber-900/20 text-amber-300 border-amber-500/30' :
                currentMission.difficulty === 'hard' ? 'bg-red-900/20 text-red-300 border-red-500/30' :
                currentMission.difficulty === 'extreme' ? 'bg-purple-900/20 text-purple-300 border-purple-500/30' :
                'bg-neutral-700 text-neutral-300'
              )}>
                {currentMission.difficulty}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-neutral-400">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Phase {currentMission.phase.phaseNumber} • {currentMission.planet.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Wave {currentMission.waveNumber}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{currentMission.attempts || 1} attempt{(currentMission.attempts || 1) > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/mission/${tbSlug}/${phaseId}/${planetId}/${missionId}`}
            className={cn(
              'btn-secondary',
              !showSquads && 'bg-blue-600 border-blue-500 text-white'
            )}
          >
            Mission Details
          </Link>
          <Link
            to={`/mission/${tbSlug}/${phaseId}/${planetId}/${missionId}/squads`}
            className={cn(
              'btn-secondary',
              showSquads && 'bg-blue-600 border-blue-500 text-white'
            )}
          >
            Squad Recommendations
          </Link>
        </div>
      </div>

      {/* Mission Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium">Max Stars</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentMission.maxStars}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium">Territory Points</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentMission.territoryPoints?.toLocaleString()}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium">Recommended Squads</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentMission.recommendedSquads?.length || 0}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-neutral-400" />
              <span className="text-sm font-medium">Attempts</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentMission.attempts || 1}</p>
          </div>
        </div>
      </div>

      {showSquads ? (
        /* Squad Recommendations View */
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Squad Recommendations</h2>
            <Link to="/squads/create" className="btn-primary">
              Contribute Squad
            </Link>
          </div>

          {squadLoading ? (
            <LoadingOverlay>Loading squad recommendations...</LoadingOverlay>
          ) : squads.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {squads.map((squad) => (
                <SquadRecommendationCard
                  key={squad.id}
                  squad={squad}
                  missionId={currentMission.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Squad Recommendations</h3>
              <p className="text-neutral-400 mb-6">
                No community squad recommendations for this mission yet.
              </p>
              <Link to="/squads/create" className="btn-primary">
                Be the First to Contribute
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Mission Details View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {currentMission.description && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-white">Mission Overview</h2>
                </div>
                <div className="card-content">
                  <p className="text-neutral-300">{currentMission.description}</p>
                </div>
              </div>
            )}

            {/* Enemy Forces */}
            {currentMission.enemyDescription && (
              <div className="card border-red-500/20">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <h2 className="text-xl font-semibold text-white">Enemy Forces</h2>
                  </div>
                </div>
                <div className="card-content">
                  <p className="text-neutral-300">{currentMission.enemyDescription}</p>
                </div>
              </div>
            )}

            {/* Modifiers */}
            {currentMission.modifiers && currentMission.modifiers.length > 0 && (
              <div className="card border-amber-500/20">
                <div className="card-header">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <h2 className="text-xl font-semibold text-white">Mission Modifiers</h2>
                  </div>
                </div>
                <div className="card-content">
                  <div className="space-y-2">
                    {currentMission.modifiers.map((modifier, index) => (
                      <div
                        key={index}
                        className="p-3 bg-neutral-800 rounded-lg border border-amber-500/20"
                      >
                        <p className="text-neutral-300">{modifier}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wave Breakdown */}
            {currentMission.waveBreakdown && (
              <WaveBreakdown
                waves={currentMission.waveBreakdown}
                missionName={currentMission.name}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Mission Stats</h3>
              </div>
              <div className="card-content space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Mission Type</span>
                  <span className="text-white font-medium capitalize">{currentMission.missionType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Difficulty</span>
                  <span className="text-white font-medium capitalize">{currentMission.difficulty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Max Stars</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(currentMission.maxStars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Territory Points</span>
                  <span className="text-white font-medium">{currentMission.territoryPoints?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Strategy Video */}
            {currentMission.strategyVideoUrl && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">Strategy Video</h3>
                </div>
                <div className="card-content">
                  <a
                    href={currentMission.strategyVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Play size={20} />
                    <span>Watch Strategy</span>
                  </a>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              </div>
              <div className="card-content space-y-3">
                <Link
                  to={`/mission/${tbSlug}/${phaseId}/${planetId}/${missionId}/squads`}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Users size={16} />
                  <span>View Squad Recommendations</span>
                </Link>
                <Link
                  to="/squads/create"
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Target size={16} />
                  <span>Contribute Squad</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};