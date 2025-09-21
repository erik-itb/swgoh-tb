import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Target, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTBStore } from '../store/tbStore';
import { LoadingOverlay } from '../components/common/LoadingSpinner';
import { PhaseCard } from '../components/tb/PhaseCard';
import { PlanetCard } from '../components/tb/PlanetCard';
import { MissionCard } from '../components/tb/MissionCard';
import { Phase, Planet, CombatMission } from '../types';

export const TerritoryBattle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    currentTB,
    currentPhase,
    currentPlanet,
    loadTerritoryBattle,
    loadPhase,
    loadPlanet,
    isLoading,
    error
  } = useTBStore();

  const [selectedPhase, setSelectedPhase] = React.useState<Phase | null>(null);
  const [selectedPlanet, setSelectedPlanet] = React.useState<Planet | null>(null);
  const [missions, setMissions] = React.useState<CombatMission[]>([]);

  React.useEffect(() => {
    if (slug) {
      loadTerritoryBattle(slug);
    }
  }, [slug, loadTerritoryBattle]);

  const handlePhaseSelect = async (phase: Phase) => {
    setSelectedPhase(phase);
    setSelectedPlanet(null);
    setMissions([]);
    await loadPhase(phase.id);
  };

  const handlePlanetSelect = async (planet: Planet) => {
    setSelectedPlanet(planet);
    const planetData = await loadPlanet(planet.id);
    setMissions(planetData.combatMissions || []);
  };

  const handleBackToPhases = () => {
    setSelectedPhase(null);
    setSelectedPlanet(null);
    setMissions([]);
  };

  const handleBackToPlanets = () => {
    setSelectedPlanet(null);
    setMissions([]);
  };

  if (isLoading) {
    return <LoadingOverlay>Loading Territory Battle data...</LoadingOverlay>;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Territory Battle</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!currentTB) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-neutral-400 mb-8">
        <Link to="/" className="hover:text-white transition-colors">
          Territory Battles
        </Link>
        <span>/</span>
        <span className="text-white">{currentTB.name}</span>
        {selectedPhase && (
          <>
            <span>/</span>
            <button
              onClick={handleBackToPhases}
              className="hover:text-white transition-colors"
            >
              {selectedPhase.name}
            </button>
          </>
        )}
        {selectedPlanet && (
          <>
            <span>/</span>
            <button
              onClick={handleBackToPlanets}
              className="hover:text-white transition-colors"
            >
              {selectedPlanet.name}
            </button>
          </>
        )}
      </nav>

      {/* Territory Battle Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            to="/"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{currentTB.name}</h1>
            <p className="text-neutral-300">{currentTB.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium">Phases</span>
              </div>
              <p className="text-2xl font-bold text-white">{currentTB.totalPhases}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">Missions</span>
              </div>
              <p className="text-2xl font-bold text-white">{currentTB.totalMissions}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium">Squads</span>
              </div>
              <p className="text-2xl font-bold text-white">{currentTB.totalSquads}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-red-400" />
                <span className="text-sm font-medium">Stars</span>
              </div>
              <p className="text-2xl font-bold text-white">{currentTB.maxStars}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {!selectedPhase && (
        /* Phase Selection */
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Select Phase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTB.phases?.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onClick={() => handlePhaseSelect(phase)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedPhase && !selectedPlanet && (
        /* Planet Selection */
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedPhase.name} - Select Planet
            </h2>
            <button
              onClick={handleBackToPhases}
              className="btn-secondary"
            >
              Back to Phases
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPhase?.planets?.map((planet) => (
              <PlanetCard
                key={planet.id}
                planet={planet}
                onClick={() => handlePlanetSelect(planet)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedPhase && selectedPlanet && missions.length > 0 && (
        /* Mission Selection */
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedPlanet.name} - Combat Missions
            </h2>
            <button
              onClick={handleBackToPlanets}
              className="btn-secondary"
            >
              Back to Planets
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                tbSlug={slug!}
                phaseId={selectedPhase.id}
                planetId={selectedPlanet.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};