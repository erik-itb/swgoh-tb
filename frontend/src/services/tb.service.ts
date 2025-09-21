import { apiClient } from './api';
import {
  TerritoryBattle,
  Phase,
  Planet,
  CombatMission,
  MissionSquadRecommendation,
  StrategyVideo,
  MissionWave,
} from '../types';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class TerritoryBattleService {
  async getTerritoryBattles(): Promise<TerritoryBattle[]> {
    const response = await apiClient.get<TerritoryBattle[]>('/tb');
    return apiClient.unwrapData(response);
  }

  async getTerritoryBattleBySlug(slug: string): Promise<TerritoryBattle> {
    const response = await apiClient.get<TerritoryBattle>(`/tb/${slug}`);
    return apiClient.unwrapData(response);
  }

  async getPhase(phaseId: number): Promise<Phase> {
    const response = await apiClient.get<Phase>(`/tb/phases/${phaseId}`);
    return apiClient.unwrapData(response);
  }

  async getPlanet(planetId: number): Promise<Planet> {
    const response = await apiClient.get<Planet>(`/tb/planets/${planetId}`);
    return apiClient.unwrapData(response);
  }

  async getMission(missionId: number): Promise<CombatMission> {
    const response = await apiClient.get<CombatMission>(`/tb/missions/${missionId}`);
    return apiClient.unwrapData(response);
  }

  async getMissionWaves(missionId: number): Promise<MissionWave[]> {
    const response = await apiClient.get<MissionWave[]>(`/tb/missions/${missionId}/waves`);
    return apiClient.unwrapData(response);
  }

  async getMissionRecommendations(
    missionId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{
    recommendations: MissionSquadRecommendation[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get<MissionSquadRecommendation[]>(
      `/tb/missions/${missionId}/recommendations`,
      params
    );

    return {
      recommendations: apiClient.unwrapData(response),
      pagination: response.pagination!,
    };
  }

  async getMissionVideos(
    missionId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{
    videos: StrategyVideo[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get<StrategyVideo[]>(
      `/tb/missions/${missionId}/videos`,
      params
    );

    return {
      videos: apiClient.unwrapData(response),
      pagination: response.pagination!,
    };
  }
}

export const tbService = new TerritoryBattleService();