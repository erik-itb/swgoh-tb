import React from 'react';
import { MapPin, Lock, CheckCircle, Star } from 'lucide-react';
import { Phase } from '../../types';
import { cn } from '../../utils/helpers';

interface PhaseCardProps {
  phase: Phase;
  onClick: () => void;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase, onClick }) => {
  const getPhaseIcon = (phaseNumber: number) => {
    if (phaseNumber <= 2) return Star;
    if (phaseNumber <= 4) return MapPin;
    return CheckCircle;
  };

  const getPhaseColor = (phaseNumber: number) => {
    if (phaseNumber <= 2) return 'text-amber-400 border-amber-500/30';
    if (phaseNumber <= 4) return 'text-blue-400 border-blue-500/30';
    return 'text-green-400 border-green-500/30';
  };

  const Icon = getPhaseIcon(phase.phaseNumber);
  const colorClass = getPhaseColor(phase.phaseNumber);

  return (
    <div
      onClick={onClick}
      className={cn(
        'card hover:border-opacity-70 cursor-pointer transition-all duration-200',
        colorClass
      )}
    >
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={cn('h-6 w-6', colorClass.split(' ')[0])} />
            <h3 className="text-lg font-semibold text-white">{phase.name}</h3>
          </div>
          <span className="text-xs bg-neutral-700 px-2 py-1 rounded">
            Phase {phase.phaseNumber}
          </span>
        </div>
      </div>

      <div className="card-content">
        <p className="text-neutral-300 text-sm mb-4">{phase.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Planets:</span>
            <span className="text-white font-medium">{phase.totalPlanets}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Missions:</span>
            <span className="text-white font-medium">{phase.totalMissions}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Min Relic:</span>
            <span className="text-white font-medium">R{phase.minRelicLevel}+</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Territory Points:</span>
            <span className="text-white font-medium">{phase.territoryPoints?.toLocaleString()}</span>
          </div>
        </div>

        {phase.unlockRequirements && (
          <div className="mt-4 p-3 bg-neutral-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-300">Unlock Requirements</span>
            </div>
            <p className="text-xs text-neutral-400">{phase.unlockRequirements}</p>
          </div>
        )}
      </div>
    </div>
  );
};