import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useSquadStore } from '../../store/squadStore';
import { Unit } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface UnitSelectorProps {
  onSelect: (unit: Unit) => void;
  onClose: () => void;
  excludeUnits?: string[];
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  onSelect,
  onClose,
  excludeUnits = []
}) => {
  const { searchUnits, isLoading } = useSquadStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = React.useState<Unit[]>([]);

  React.useEffect(() => {
    const loadUnits = async () => {
      if (searchQuery.trim()) {
        try {
          const results = await searchUnits(searchQuery);
          setUnits(results);
        } catch (error) {
          console.error('Failed to search units:', error);
          setUnits([]);
        }
      } else {
        setUnits([]);
      }
    };

    const debounceTimer = setTimeout(loadUnits, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchUnits]);

  React.useEffect(() => {
    const filtered = units.filter(unit =>
      !excludeUnits.includes(unit.name)
    );
    setFilteredUnits(filtered);
  }, [units, excludeUnits]);

  const handleSelect = (unit: Unit) => {
    onSelect(unit);
  };

  const popularUnits = [
    'Grand Admiral Thrawn',
    'Emperor Palpatine',
    'Darth Vader',
    'Commander Luke Skywalker',
    'Jedi Knight Revan',
    'Darth Revan',
    'General Skywalker',
    'Supreme Leader Kylo Ren',
    'Rey (Jedi Training)',
    'Grand Master Yoda',
    'Darth Malak',
    'General Kenobi',
    'Han Solo (Millennium Falcon)',
    'Chewbacca (Millennium Falcon)',
    'C-3PO',
    'R2-D2',
    'BB-8',
    'Imperial Probe Droid',
    'Death Trooper',
    'Range Trooper'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">Select Unit</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded transition-colors"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-neutral-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : searchQuery.trim() ? (
            filteredUnits.length > 0 ? (
              <div className="space-y-2">
                {filteredUnits.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => handleSelect(unit)}
                    className="w-full p-3 text-left border border-neutral-700 rounded-lg hover:border-blue-500/50 hover:bg-neutral-800/50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{unit.name}</h3>
                        <p className="text-sm text-neutral-400">
                          {unit.faction} • {unit.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-neutral-500">
                          {unit.stars}★ • {unit.relic ? `R${unit.relic}` : `G${unit.gearLevel}`}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-400 mb-4">No units found matching "{searchQuery}"</p>
                <p className="text-sm text-neutral-500">
                  Try searching for character names like "Luke Skywalker" or "Darth Vader"
                </p>
              </div>
            )
          ) : (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Popular Units</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {popularUnits
                  .filter(name => !excludeUnits.includes(name))
                  .map((unitName) => (
                    <button
                      key={unitName}
                      onClick={() => handleSelect({
                        id: Date.now() + Math.random(), // Temporary ID
                        name: unitName,
                        faction: 'Unknown',
                        role: 'Unknown',
                        stars: 7,
                        gearLevel: 13,
                        relic: 5
                      })}
                      className="p-3 text-left border border-neutral-700 rounded-lg hover:border-blue-500/50 hover:bg-neutral-800/50 transition-all duration-200"
                    >
                      <h4 className="text-white font-medium text-sm">{unitName}</h4>
                    </button>
                  ))}
              </div>
              <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">
                  <strong>Tip:</strong> Use the search box above to find specific units.
                  You can search by character name, faction, or role.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};