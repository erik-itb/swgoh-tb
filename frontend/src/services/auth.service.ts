import { apiClient } from './api';
import { User, AuthData, LoginCredentials, RegisterData } from '../types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthData> {
    const response = await apiClient.post<AuthData>('/auth/login', credentials);
    return apiClient.unwrapData(response);
  }

  async register(data: RegisterData): Promise<AuthData> {
    const response = await apiClient.post<AuthData>('/auth/register', data);
    return apiClient.unwrapData(response);
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return apiClient.unwrapData(response);
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    return apiClient.unwrapData(response);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    apiClient.unwrapData(response);
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });
    return apiClient.unwrapData(response).token;
  }

  async logout(): Promise<void> {
    const response = await apiClient.post('/auth/logout');
    apiClient.unwrapData(response);
  }
}

export const authService = new AuthService();