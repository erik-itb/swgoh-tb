import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, TrendingUp, Star } from 'lucide-react';
import { useTBStore } from '../store/tbStore';
import { LoadingOverlay } from '../components/common/LoadingSpinner';
import { formatNumber } from '../utils/helpers';

export const Home: React.FC = () => {
  const { loadTerritoryBattles, isLoading, error } = useTBStore();
  const [territoryBattles, setTerritoryBattles] = React.useState<any[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const tbs = await loadTerritoryBattles();
        setTerritoryBattles(tbs);
      } catch (err) {
        console.error('Failed to load territory battles:', err);
      }
    };
    load();
  }, [loadTerritoryBattles]);

  if (isLoading) {
    return <LoadingOverlay>Loading Territory Battles...</LoadingOverlay>;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h2>
          <p className="text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">
          Rise of the Empire
        </h1>
        <p className="text-xl text-neutral-300 mb-8 max-w-3xl mx-auto">
          Master the Territory Battle with comprehensive squad recommendations,
          strategy videos, and detailed mission breakdowns for every phase.
        </p>

        {territoryBattles.length > 0 && (
          <Link
            to={`/tb/${territoryBattles[0].slug}`}
            className="btn-primary text-lg px-8 py-3"
          >
            Start Territory Battle
          </Link>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="card text-center">
          <div className="card-content">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">6 Phases</h3>
            <p className="text-neutral-400 text-sm">
              Complete phase-by-phase breakdown from Relic 5+ to Relic 9+
            </p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-content">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Squad Recommendations</h3>
            <p className="text-neutral-400 text-sm">
              Community-tested squad compositions with success rates
            </p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-content">
            <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Strategy Videos</h3>
            <p className="text-neutral-400 text-sm">
              Curated video content from top SWGOH creators
            </p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-content">
            <Star className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Mission Details</h3>
            <p className="text-neutral-400 text-sm">
              Wave breakdowns, modifiers, and territory point requirements
            </p>
          </div>
        </div>
      </div>

      {/* Territory Battles List */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Available Territory Battles
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {territoryBattles.map((tb) => (
            <Link key={tb.id} to={`/tb/${tb.slug}`}>
              <div className="card hover:border-blue-500 transition-colors cursor-pointer">
                <div className="card-header">
                  <h3 className="text-xl font-semibold text-white">{tb.name}</h3>
                </div>
                <div className="card-content">
                  <p className="text-neutral-300 mb-4">{tb.description}</p>
                  <div className="flex justify-between items-center text-sm text-neutral-400">
                    <span>{tb.totalPhases} Phases</span>
                    <span>{tb.phases?.length || 0} Configured</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="card bg-gradient-to-r from-blue-600/20 to-red-600/20 border-blue-500/30">
        <div className="card-content text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Contribute to the Community
          </h2>
          <p className="text-neutral-300 mb-6 max-w-2xl mx-auto">
            Share your successful squad compositions and help other players
            achieve maximum stars in Territory Battles.
          </p>
          <Link to="/squads/create" className="btn-primary">
            Create Squad
          </Link>
        </div>
      </div>
    </div>
  );
};