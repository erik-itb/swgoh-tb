import React from 'react';
import {
  Shield,
  Sword,
  Users,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '../../utils/helpers';

interface WaveEnemy {
  name: string;
  type: 'tank' | 'damage' | 'support' | 'healer' | 'leader';
  health?: number;
  protection?: number;
  abilities?: string[];
  weaknesses?: string[];
  threats?: string[];
}

interface Wave {
  waveNumber: number;
  title?: string;
  description?: string;
  enemies: WaveEnemy[];
  modifiers?: string[];
  strategy?: string;
  rewards?: {
    territoryPoints?: number;
    stars?: number;
  };
}

interface WaveBreakdownProps {
  waves: Wave[];
  missionName: string;
}

export const WaveBreakdown: React.FC<WaveBreakdownProps> = ({
  waves,
  missionName
}) => {
  const [expandedWaves, setExpandedWaves] = React.useState<Set<number>>(new Set([1]));

  const toggleWave = (waveNumber: number) => {
    const newExpanded = new Set(expandedWaves);
    if (newExpanded.has(waveNumber)) {
      newExpanded.delete(waveNumber);
    } else {
      newExpanded.add(waveNumber);
    }
    setExpandedWaves(newExpanded);
  };

  const getEnemyTypeIcon = (type: string) => {
    switch (type) {
      case 'tank': return Shield;
      case 'damage': return Sword;
      case 'support': return Users;
      case 'healer': return Star;
      case 'leader': return Target;
      default: return Users;
    }
  };

  const getEnemyTypeColor = (type: string) => {
    switch (type) {
      case 'tank': return 'text-blue-400';
      case 'damage': return 'text-red-400';
      case 'support': return 'text-green-400';
      case 'healer': return 'text-amber-400';
      case 'leader': return 'text-purple-400';
      default: return 'text-neutral-400';
    }
  };

  if (!waves || waves.length === 0) {
    return null;
  }

  return (
    <div className="card border-purple-500/20">
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Wave Breakdown</h2>
        </div>
        <p className="text-sm text-neutral-400 mt-1">
          Detailed breakdown of each wave in {missionName}
        </p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {waves.map((wave) => (
            <div key={wave.waveNumber} className="border border-neutral-700 rounded-lg">
              {/* Wave Header */}
              <button
                onClick={() => toggleWave(wave.waveNumber)}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {expandedWaves.has(wave.waveNumber) ? (
                      <ChevronDown className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-neutral-400" />
                    )}
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-white">
                      Wave {wave.waveNumber}
                      {wave.title && ` - ${wave.title}`}
                    </h3>
                    <p className="text-sm text-neutral-400">
                      {wave.enemies.length} enemies
                      {wave.rewards?.stars && ` • ${wave.rewards.stars} star${wave.rewards.stars > 1 ? 's' : ''}`}
                      {wave.rewards?.territoryPoints && ` • ${wave.rewards.territoryPoints.toLocaleString()} TP`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {wave.modifiers && wave.modifiers.length > 0 && (
                    <span className="text-xs bg-amber-900/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">
                      {wave.modifiers.length} modifier{wave.modifiers.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>

              {/* Wave Content */}
              {expandedWaves.has(wave.waveNumber) && (
                <div className="p-4 border-t border-neutral-700 space-y-4">
                  {/* Description */}
                  {wave.description && (
                    <p className="text-neutral-300 text-sm">{wave.description}</p>
                  )}

                  {/* Modifiers */}
                  {wave.modifiers && wave.modifiers.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-300">Wave Modifiers</span>
                      </div>
                      <div className="space-y-1">
                        {wave.modifiers.map((modifier, index) => (
                          <div
                            key={index}
                            className="text-xs bg-amber-900/10 border border-amber-500/20 px-2 py-1 rounded text-amber-200"
                          >
                            {modifier}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enemies */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium text-red-300">Enemy Forces</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {wave.enemies.map((enemy, index) => {
                        const IconComponent = getEnemyTypeIcon(enemy.type);
                        const colorClass = getEnemyTypeColor(enemy.type);

                        return (
                          <div
                            key={index}
                            className="border border-neutral-700 rounded-lg p-3 bg-neutral-800/30"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <IconComponent className={cn('h-4 w-4', colorClass)} />
                                <div>
                                  <h4 className="text-sm font-medium text-white">{enemy.name}</h4>
                                  <p className="text-xs text-neutral-400 capitalize">{enemy.type}</p>
                                </div>
                              </div>
                            </div>

                            {(enemy.health || enemy.protection) && (
                              <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                                {enemy.health && (
                                  <div className="bg-red-900/20 px-2 py-1 rounded">
                                    <span className="text-red-300">HP: {enemy.health.toLocaleString()}</span>
                                  </div>
                                )}
                                {enemy.protection && (
                                  <div className="bg-blue-900/20 px-2 py-1 rounded">
                                    <span className="text-blue-300">Prot: {enemy.protection.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {enemy.abilities && enemy.abilities.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs text-neutral-400 mb-1">Key Abilities:</p>
                                <div className="space-y-1">
                                  {enemy.abilities.slice(0, 2).map((ability, abilityIndex) => (
                                    <div
                                      key={abilityIndex}
                                      className="text-xs bg-neutral-700 px-2 py-1 rounded text-neutral-300"
                                    >
                                      {ability}
                                    </div>
                                  ))}
                                  {enemy.abilities.length > 2 && (
                                    <div className="text-xs text-neutral-500">
                                      +{enemy.abilities.length - 2} more abilities
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              {enemy.weaknesses && enemy.weaknesses.length > 0 && (
                                <div>
                                  <p className="text-xs text-green-400 mb-1">Weaknesses:</p>
                                  <div className="space-y-1">
                                    {enemy.weaknesses.slice(0, 1).map((weakness, weakIndex) => (
                                      <div
                                        key={weakIndex}
                                        className="text-xs bg-green-900/20 border border-green-500/30 px-1 py-0.5 rounded text-green-300"
                                      >
                                        {weakness}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {enemy.threats && enemy.threats.length > 0 && (
                                <div>
                                  <p className="text-xs text-red-400 mb-1">Threats:</p>
                                  <div className="space-y-1">
                                    {enemy.threats.slice(0, 1).map((threat, threatIndex) => (
                                      <div
                                        key={threatIndex}
                                        className="text-xs bg-red-900/20 border border-red-500/30 px-1 py-0.5 rounded text-red-300"
                                      >
                                        {threat}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strategy */}
                  {wave.strategy && (
                    <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">Strategy Tips</span>
                      </div>
                      <p className="text-xs text-blue-200">{wave.strategy}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};