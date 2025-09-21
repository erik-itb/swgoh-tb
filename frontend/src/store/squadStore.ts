import { create } from 'zustand';
import { Squad, CreateSquadData, Unit, SquadType } from '../types';
import { squadService } from '../services/squad.service';

interface SquadQueryParams {
  page?: number;
  limit?: number;
  squadType?: SquadType;
  published?: boolean;
  search?: string;
}

interface SquadState {
  // Data
  squads: Squad[];
  currentSquad: Squad | null;
  units: Unit[];

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Loading states
  isLoading: boolean;
  isLoadingSquad: boolean;
  isLoadingUnits: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  loadSquads: (params?: SquadQueryParams) => Promise<void>;
  loadSquad: (id: number) => Promise<void>;
  loadUnits: () => Promise<void>;
  createSquad: (data: CreateSquadData) => Promise<Squad>;
  updateSquad: (id: number, data: Partial<CreateSquadData>) => Promise<Squad>;
  deleteSquad: (id: number) => Promise<void>;
  publishSquad: (id: number) => Promise<void>;
  addUnitToSquad: (squadId: number, unitId: number, position?: number) => Promise<void>;
  removeUnitFromSquad: (squadId: number, unitId: number) => Promise<void>;
  clearCurrentSquad: () => void;
  clearError: () => void;
}

export const useSquadStore = create<SquadState>((set, get) => ({
  squads: [],
  currentSquad: null,
  units: [],

  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  isLoading: false,
  isLoadingSquad: false,
  isLoadingUnits: false,
  isSaving: false,

  error: null,

  loadSquads: async (params: SquadQueryParams = {}) => {
    try {
      set({ isLoading: true, error: null });
      const { squads, pagination } = await squadService.getSquads(params);

      set({
        squads,
        pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load squads',
      });
      throw error;
    }
  },

  loadSquad: async (id: number) => {
    try {
      set({ isLoadingSquad: true, error: null });
      const squad = await squadService.getSquadById(id);

      set({
        currentSquad: squad,
        isLoadingSquad: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoadingSquad: false,
        error: error instanceof Error ? error.message : 'Failed to load squad',
      });
      throw error;
    }
  },

  loadUnits: async () => {
    try {
      set({ isLoadingUnits: true, error: null });
      const units = await squadService.getUnits();

      set({
        units,
        isLoadingUnits: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoadingUnits: false,
        error: error instanceof Error ? error.message : 'Failed to load units',
      });
      throw error;
    }
  },

  createSquad: async (data: CreateSquadData) => {
    try {
      set({ isSaving: true, error: null });
      const squad = await squadService.createSquad(data);

      // Add to local squads array
      set((state) => ({
        squads: [squad, ...state.squads],
        currentSquad: squad,
        isSaving: false,
        error: null,
      }));

      return squad;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create squad',
      });
      throw error;
    }
  },

  updateSquad: async (id: number, data: Partial<CreateSquadData>) => {
    try {
      set({ isSaving: true, error: null });
      const squad = await squadService.updateSquad(id, data);

      // Update in local arrays
      set((state) => ({
        squads: state.squads.map((s) => (s.id === id ? squad : s)),
        currentSquad: state.currentSquad?.id === id ? squad : state.currentSquad,
        isSaving: false,
        error: null,
      }));

      return squad;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update squad',
      });
      throw error;
    }
  },

  deleteSquad: async (id: number) => {
    try {
      set({ isSaving: true, error: null });
      await squadService.deleteSquad(id);

      // Remove from local arrays
      set((state) => ({
        squads: state.squads.filter((s) => s.id !== id),
        currentSquad: state.currentSquad?.id === id ? null : state.currentSquad,
        isSaving: false,
        error: null,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to delete squad',
      });
      throw error;
    }
  },

  publishSquad: async (id: number) => {
    try {
      set({ isSaving: true, error: null });
      const squad = await squadService.publishSquad(id);

      // Update in local arrays
      set((state) => ({
        squads: state.squads.map((s) => (s.id === id ? squad : s)),
        currentSquad: state.currentSquad?.id === id ? squad : state.currentSquad,
        isSaving: false,
        error: null,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to publish squad',
      });
      throw error;
    }
  },

  addUnitToSquad: async (squadId: number, unitId: number, position?: number) => {
    try {
      set({ isSaving: true, error: null });
      await squadService.addUnitToSquad(squadId, {
        unitId,
        position,
      });

      // Reload the current squad to get updated data
      if (get().currentSquad?.id === squadId) {
        await get().loadSquad(squadId);
      }

      set({ isSaving: false, error: null });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to add unit to squad',
      });
      throw error;
    }
  },

  removeUnitFromSquad: async (squadId: number, unitId: number) => {
    try {
      set({ isSaving: true, error: null });
      await squadService.removeUnitFromSquad(squadId, unitId);

      // Reload the current squad to get updated data
      if (get().currentSquad?.id === squadId) {
        await get().loadSquad(squadId);
      }

      set({ isSaving: false, error: null });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to remove unit from squad',
      });
      throw error;
    }
  },

  clearCurrentSquad: () => {
    set({ currentSquad: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));