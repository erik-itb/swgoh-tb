import React, { useState } from 'react';
import { UnitPortrait, Unit } from '../common/UnitPortrait';
import { UnitPickerModal } from './UnitPickerModal';

interface SquadBuilderProps {
  initialSquad?: (Unit | null)[];
  onSquadChange?: (squad: (Unit | null)[]) => void;
  maxUnits?: number;
  className?: string;
}

export const SquadBuilder: React.FC<SquadBuilderProps> = ({
  initialSquad = [null, null, null, null, null],
  onSquadChange,
  maxUnits = 5,
  className = ''
}) => {
  const [squad, setSquad] = useState<(Unit | null)[]>(
    initialSquad.slice(0, maxUnits).concat(
      Array(Math.max(0, maxUnits - initialSquad.length)).fill(null)
    )
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
    setIsPickerOpen(true);
  };

  const handleUnitSelect = (unit: Unit) => {
    if (selectedSlot === null) return;

    const newSquad = [...squad];
    newSquad[selectedSlot] = unit;
    setSquad(newSquad);
    onSquadChange?.(newSquad);
    setIsPickerOpen(false);
    setSelectedSlot(null);
  };

  const handleUnitRemove = (slotIndex: number) => {
    const newSquad = [...squad];
    newSquad[slotIndex] = null;
    setSquad(newSquad);
    onSquadChange?.(newSquad);
  };

  const getSquadPower = () => {
    return squad.filter(unit => unit !== null).length;
  };

  const getSquadAlignment = () => {
    const alignments = squad
      .filter(unit => unit !== null)
      .map(unit => unit!.alignment);
    
    if (alignments.length === 0) return null;
    
    const lightSide = alignments.filter(a => a === 'LIGHT_SIDE').length;
    const darkSide = alignments.filter(a => a === 'DARK_SIDE').length;
    
    if (lightSide > darkSide) return 'LIGHT_SIDE';
    if (darkSide > lightSide) return 'DARK_SIDE';
    return 'MIXED';
  };

  const getAlignmentColor = (alignment: string | null) => {
    switch (alignment) {
      case 'LIGHT_SIDE': return 'text-blue-600';
      case 'DARK_SIDE': return 'text-red-600';
      case 'MIXED': return 'text-purple-600';
      default: return 'text-gray-500';
    }
  };

  const getAlignmentLabel = (alignment: string | null) => {
    switch (alignment) {
      case 'LIGHT_SIDE': return 'Light Side';
      case 'DARK_SIDE': return 'Dark Side';
      case 'MIXED': return 'Mixed';
      default: return 'No Alignment';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Squad header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Squad Builder</h3>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            {getSquadPower()}/{maxUnits} Units
          </span>
          <span className={`font-medium ${getAlignmentColor(getSquadAlignment())}`}>
            {getAlignmentLabel(getSquadAlignment())}
          </span>
        </div>
      </div>

      {/* Squad slots - horizontal layout */}
      <div className="flex justify-center space-x-4 mb-6">
        {squad.map((unit, index) => (
          <div key={index} className="relative group">
            <UnitPortrait
              unit={unit}
              size="xl"
              showName={true}
              isLeader={index === 0}
              onClick={() => handleSlotClick(index)}
              className="transition-all duration-200"
            />
            
            {/* Remove button for occupied slots */}
            {unit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnitRemove(index);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove unit"
              >
                ×
              </button>
            )}
            
            {/* Slot number indicator */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium">
              {index === 0 ? 'Leader' : `Slot ${index + 1}`}
            </div>
          </div>
        ))}
      </div>

      {/* Squad actions */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={() => {
            const emptySquad = Array(maxUnits).fill(null);
            setSquad(emptySquad);
            onSquadChange?.(emptySquad);
          }}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          disabled={getSquadPower() === 0}
        >
          Clear Squad
        </button>
        
        <button
          onClick={() => {
            // TODO: Implement save squad functionality
            console.log('Save squad:', squad);
          }}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={getSquadPower() === 0}
        >
          Save Squad
        </button>
      </div>

      {/* Squad summary */}
      {getSquadPower() > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Squad Composition:</span>
              <span>{getSquadPower()} characters</span>
            </div>
            
            {/* Show unique factions */}
            {(() => {
              const factions = squad
                .filter(unit => unit !== null)
                .flatMap(unit => unit!.factions)
                .filter((faction, index, arr) => arr.indexOf(faction) === index);
              
              if (factions.length > 0) {
                return (
                  <div className="flex justify-between mt-1">
                    <span>Factions:</span>
                    <span className="text-right max-w-48 truncate">
                      {factions.slice(0, 3).join(', ')}
                      {factions.length > 3 && ` +${factions.length - 3} more`}
                    </span>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* Unit picker modal */}
      <UnitPickerModal
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setSelectedSlot(null);
        }}
        onUnitSelect={handleUnitSelect}
        selectedSlot={selectedSlot}
        isLeaderSlot={selectedSlot === 0}
        excludeUnits={squad.filter(unit => unit !== null).map(unit => unit!.gameId)}
      />
    </div>
  );
};