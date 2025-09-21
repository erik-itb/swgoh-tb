import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Users, Star, Calendar } from 'lucide-react';
import { useSquadStore } from '../store/squadStore';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/common/LoadingSpinner';
import { SquadCard } from '../components/squads/SquadCard';
import { SquadFilters } from '../components/squads/SquadFilters';
import { Squad, SquadType } from '../types';

export const Squads: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    squads,
    pagination,
    isLoading,
    error,
    loadSquads,
    filters,
    updateFilters
  } = useSquadStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  React.useEffect(() => {
    loadSquads({
      page: 1,
      limit: 12,
      search: searchQuery || undefined,
      squadType: filters.squadType,
      published: filters.published
    });
  }, [loadSquads, searchQuery, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSquads({
      page: 1,
      limit: 12,
      search: searchQuery || undefined,
      squadType: filters.squadType,
      published: filters.published
    });
  };

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      loadSquads({
        page: pagination.page + 1,
        limit: 12,
        search: searchQuery || undefined,
        squadType: filters.squadType,
        published: filters.published
      });
    }
  };

  const canCreateSquad = isAuthenticated && (
    user?.role === 'CONTRIBUTOR' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN'
  );

  if (isLoading && squads.length === 0) {
    return <LoadingOverlay>Loading squad recommendations...</LoadingOverlay>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Squad Recommendations</h1>
          <p className="text-neutral-300">
            Community-tested squad compositions for Territory Battles
          </p>
        </div>
        {canCreateSquad && (
          <Link
            to="/squads/create"
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Plus size={20} />
            <span>Create Squad</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search squads, units, or strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </form>

        {showFilters && (
          <SquadFilters
            filters={filters}
            onFiltersChange={updateFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-neutral-400">Total Squads</p>
                <p className="text-xl font-bold text-white">{pagination?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <Star className="h-6 w-6 text-amber-400" />
              <div>
                <p className="text-sm text-neutral-400">Published</p>
                <p className="text-xl font-bold text-white">
                  {squads.filter(s => s.isPublished).length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-sm text-neutral-400">This Week</p>
                <p className="text-xl font-bold text-white">
                  {squads.filter(s => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(s.createdAt) > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Squad Grid */}
      {squads.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {squads.map((squad) => (
              <SquadCard key={squad.id} squad={squad} />
            ))}
          </div>

          {/* Load More */}
          {pagination && pagination.page < pagination.totalPages && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="btn-secondary"
              >
                {isLoading ? 'Loading...' : 'Load More Squads'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No squads found</h3>
          <p className="text-neutral-400 mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'No squads match your search criteria. Try adjusting your filters or search terms.'
              : 'No squad recommendations available yet. Be the first to contribute!'}
          </p>
          {canCreateSquad && (
            <Link to="/squads/create" className="btn-primary">
              Create First Squad
            </Link>
          )}
        </div>
      )}
    </div>
  );
};