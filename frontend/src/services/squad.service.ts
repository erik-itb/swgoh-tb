import { apiClient } from './api';
import { Squad, CreateSquadData, Unit, SquadType, AddSquadUnitData } from '../types';

interface SquadQueryParams {
  page?: number;
  limit?: number;
  squadType?: SquadType;
  published?: boolean;
  search?: string;
}

class SquadService {
  async getSquads(params?: SquadQueryParams): Promise<{
    squads: Squad[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get<Squad[]>('/squads', params);
    return {
      squads: apiClient.unwrapData(response),
      pagination: response.pagination!,
    };
  }

  async getSquadById(id: number): Promise<Squad> {
    const response = await apiClient.get<Squad>(`/squads/${id}`);
    return apiClient.unwrapData(response);
  }

  async createSquad(data: CreateSquadData): Promise<Squad> {
    const response = await apiClient.post<Squad>('/squads', data);
    return apiClient.unwrapData(response);
  }

  async updateSquad(id: number, data: Partial<CreateSquadData>): Promise<Squad> {
    const response = await apiClient.put<Squad>(`/squads/${id}`, data);
    return apiClient.unwrapData(response);
  }

  async deleteSquad(id: number): Promise<void> {
    const response = await apiClient.delete(`/squads/${id}`);
    apiClient.unwrapData(response);
  }

  async publishSquad(id: number): Promise<Squad> {
    const response = await apiClient.post<Squad>(`/squads/${id}/publish`);
    return apiClient.unwrapData(response);
  }

  async addUnitToSquad(squadId: number, data: AddSquadUnitData): Promise<void> {
    const response = await apiClient.post(`/squads/${squadId}/units`, data);
    apiClient.unwrapData(response);
  }

  async removeUnitFromSquad(squadId: number, unitId: number): Promise<void> {
    const response = await apiClient.delete(`/squads/${squadId}/units/${unitId}`);
    apiClient.unwrapData(response);
  }

  async getUnits(): Promise<Unit[]> {
    // This would typically be a separate endpoint
    // For now, we'll implement a basic version
    const response = await apiClient.get<Unit[]>('/units');
    return apiClient.unwrapData(response);
  }

  async searchUnits(query: string): Promise<Unit[]> {
    const response = await apiClient.get<Unit[]>('/units/search', { q: query });
    return apiClient.unwrapData(response);
  }
}

export const squadService = new SquadService();