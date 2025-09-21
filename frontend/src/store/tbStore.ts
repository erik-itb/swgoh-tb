import { create } from 'zustand';
import { TerritoryBattle, Phase, Planet, CombatMission } from '../types';
import { tbService } from '../services/tb.service';

interface TBState {
  // Current selections
  territoryBattle: TerritoryBattle | null;
  currentPhase: Phase | null;
  currentPlanet: Planet | null;
  currentMission: CombatMission | null;

  // Loading states
  isLoading: boolean;
  isLoadingPhase: boolean;
  isLoadingPlanet: boolean;
  isLoadingMission: boolean;

  // Error states
  error: string | null;

  // Actions
  loadTerritoryBattles: () => Promise<TerritoryBattle[]>;
  loadTerritoryBattle: (slug: string) => Promise<void>;
  selectPhase: (phaseId: number) => Promise<void>;
  selectPlanet: (planetId: number) => Promise<void>;
  selectMission: (missionId: number) => Promise<void>;
  clearSelections: () => void;
  clearError: () => void;
}

export const useTBStore = create<TBState>((set, get) => ({
  territoryBattle: null,
  currentPhase: null,
  currentPlanet: null,
  currentMission: null,

  isLoading: false,
  isLoadingPhase: false,
  isLoadingPlanet: false,
  isLoadingMission: false,

  error: null,

  loadTerritoryBattles: async () => {
    try {
      set({ isLoading: true, error: null });
      const territoryBattles = await tbService.getTerritoryBattles();
      set({ isLoading: false });
      return territoryBattles;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load territory battles',
      });
      throw error;
    }
  },

  loadTerritoryBattle: async (slug: string) => {
    try {
      set({ isLoading: true, error: null });
      const territoryBattle = await tbService.getTerritoryBattleBySlug(slug);

      set({
        territoryBattle,
        isLoading: false,
        error: null,
        // Clear current selections when loading new TB
        currentPhase: null,
        currentPlanet: null,
        currentMission: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load territory battle',
      });
      throw error;
    }
  },

  selectPhase: async (phaseId: number) => {
    try {
      set({ isLoadingPhase: true, error: null });
      const phase = await tbService.getPhase(phaseId);

      set({
        currentPhase: phase,
        isLoadingPhase: false,
        error: null,
        // Clear planet and mission when selecting new phase
        currentPlanet: null,
        currentMission: null,
      });
    } catch (error) {
      set({
        isLoadingPhase: false,
        error: error instanceof Error ? error.message : 'Failed to load phase',
      });
      throw error;
    }
  },

  selectPlanet: async (planetId: number) => {
    try {
      set({ isLoadingPlanet: true, error: null });
      const planet = await tbService.getPlanet(planetId);

      set({
        currentPlanet: planet,
        isLoadingPlanet: false,
        error: null,
        // Clear mission when selecting new planet
        currentMission: null,
      });
    } catch (error) {
      set({
        isLoadingPlanet: false,
        error: error instanceof Error ? error.message : 'Failed to load planet',
      });
      throw error;
    }
  },

  selectMission: async (missionId: number) => {
    try {
      set({ isLoadingMission: true, error: null });
      const mission = await tbService.getMission(missionId);

      set({
        currentMission: mission,
        isLoadingMission: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoadingMission: false,
        error: error instanceof Error ? error.message : 'Failed to load mission',
      });
      throw error;
    }
  },

  clearSelections: () => {
    set({
      territoryBattle: null,
      currentPhase: null,
      currentPlanet: null,
      currentMission: null,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));