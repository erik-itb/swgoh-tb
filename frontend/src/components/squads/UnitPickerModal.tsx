import React, { useState, useEffect } from 'react';
import { UnitPortrait, Unit } from '../common/UnitPortrait';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { API_BASE_URL } from '../../utils/constants';

interface UnitPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnitSelect: (unit: Unit) => void;
  selectedSlot?: number | null;
  isLeaderSlot?: boolean;
  excludeUnits?: string[]; // gameIds to exclude
}

export const UnitPickerModal: React.FC<UnitPickerModalProps> = ({
  isOpen,
  onClose,
  onUnitSelect,
  selectedSlot,
  isLeaderSlot = false,
  excludeUnits = []
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlignment, setSelectedAlignment] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch units when modal opens
  useEffect(() => {
    if (isOpen && units.length === 0) {
      fetchUnits();
    }
  }, [isOpen]);

  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/units`);
      if (!response.ok) {
        throw new Error('Failed to fetch units');
      }
      
      const data = await response.json();
      setUnits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  // Filter units based on search and filters
  const filteredUnits = units.filter(unit => {
    // Exclude units already in squad
    if (excludeUnits.includes(unit.gameId)) return false;
    
    // Search filter
    if (searchTerm && !unit.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Alignment filter
    if (selectedAlignment !== 'all' && unit.alignment !== selectedAlignment) {
      return false;
    }
    
    // Type filter
    if (selectedType !== 'all' && unit.unitType !== selectedType) {
      return false;
    }
    
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Select Character
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isLeaderSlot ? 'Choose a leader for your squad' : `Choose a character for slot ${(selectedSlot || 0) + 1}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search characters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Alignment filter */}
              <select
                value={selectedAlignment}
                onChange={(e) => setSelectedAlignment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Alignments</option>
                <option value="LIGHT_SIDE">Light Side</option>
                <option value="DARK_SIDE">Dark Side</option>
                <option value="NEUTRAL">Neutral</option>
              </select>
              
              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="CHARACTER">Characters</option>
                <option value="SHIP">Ships</option>
                <option value="CAPITAL_SHIP">Capital Ships</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={fetchUnits}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {units.length === 0 ? 'No characters available' : 'No characters match your filters'}
              </div>
            ) : (
              /* Character grid */
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {filteredUnits.map((unit) => (
                  <div
                    key={unit.gameId}
                    className="flex flex-col items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => onUnitSelect(unit)}
                  >
                    <UnitPortrait
                      unit={unit}
                      size="lg"
                      showName={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {filteredUnits.length} character{filteredUnits.length !== 1 ? 's' : ''} available
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};