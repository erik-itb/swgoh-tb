import React from 'react';
import { X, Filter } from 'lucide-react';
import { SquadType } from '../../types';

interface SquadFiltersProps {
  filters: {
    squadType?: SquadType;
    published?: boolean;
  };
  onFiltersChange: (filters: { squadType?: SquadType; published?: boolean }) => void;
  onClose: () => void;
}

export const SquadFilters: React.FC<SquadFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const squadTypes: { value: SquadType; label: string }[] = [
    { value: 'GALACTIC_REPUBLIC', label: 'Galactic Republic' },
    { value: 'SEPARATISTS', label: 'Separatists' },
    { value: 'REBEL_ALLIANCE', label: 'Rebel Alliance' },
    { value: 'EMPIRE', label: 'Empire' },
    { value: 'FIRST_ORDER', label: 'First Order' },
    { value: 'RESISTANCE', label: 'Resistance' },
    { value: 'JEDI', label: 'Jedi' },
    { value: 'SITH', label: 'Sith' },
    { value: 'SCOUNDRELS', label: 'Scoundrels' },
    { value: 'BOUNTY_HUNTERS', label: 'Bounty Hunters' },
    { value: 'MANDALORIANS', label: 'Mandalorians' },
    { value: 'NIGHTSISTERS', label: 'Nightsisters' },
    { value: 'PHOENIX', label: 'Phoenix Squadron' },
    { value: 'ROGUE_ONE', label: 'Rogue One' },
    { value: 'CLONE_TROOPERS', label: 'Clone Troopers' },
    { value: 'IMPERIAL_TROOPERS', label: 'Imperial Troopers' },
    { value: 'EWOKS', label: 'Ewoks' },
    { value: 'TUSKEN_RAIDERS', label: 'Tusken Raiders' },
    { value: 'GEONOSIANS', label: 'Geonosians' },
    { value: 'DROIDS', label: 'Droids' },
    { value: 'JAWAS', label: 'Jawas' },
    { value: 'MIXED', label: 'Mixed Factions' }
  ];

  const handleSquadTypeChange = (squadType: SquadType | '') => {
    onFiltersChange({
      ...filters,
      squadType: squadType || undefined
    });
  };

  const handlePublishedChange = (published: boolean | null) => {
    onFiltersChange({
      ...filters,
      published: published === null ? undefined : published
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.squadType || filters.published !== undefined;

  return (
    <div className="card bg-neutral-800 border-neutral-700">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-600 rounded transition-colors"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>
      </div>

      <div className="card-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Squad Type Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Squad Type
            </label>
            <select
              value={filters.squadType || ''}
              onChange={(e) => handleSquadTypeChange(e.target.value as SquadType)}
              className="input w-full"
            >
              <option value="">All Types</option>
              {squadTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Published Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Status
            </label>
            <select
              value={
                filters.published === undefined
                  ? 'all'
                  : filters.published
                  ? 'published'
                  : 'draft'
              }
              onChange={(e) => {
                const value = e.target.value;
                handlePublishedChange(
                  value === 'all' ? null : value === 'published'
                );
              }}
              className="input w-full"
            >
              <option value="all">All Squads</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-neutral-300">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.squadType && (
                <span className="inline-flex items-center space-x-1 bg-blue-900/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-500/30">
                  <span>
                    {squadTypes.find(t => t.value === filters.squadType)?.label}
                  </span>
                  <button
                    onClick={() => handleSquadTypeChange('')}
                    className="hover:text-blue-200"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.published !== undefined && (
                <span className="inline-flex items-center space-x-1 bg-green-900/20 text-green-300 text-xs px-2 py-1 rounded border border-green-500/30">
                  <span>{filters.published ? 'Published' : 'Draft'}</span>
                  <button
                    onClick={() => handlePublishedChange(null)}
                    className="hover:text-green-200"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};