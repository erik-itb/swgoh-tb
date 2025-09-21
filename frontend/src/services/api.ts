import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../utils/constants';
import { ApiResponse } from '../types';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { token } = response.data.data;
            localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear auth data and redirect to login
            localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);

            // Dispatch custom event to notify auth store
            window.dispatchEvent(new CustomEvent('auth:logout'));

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url);
    return response.data;
  }

  // Helper methods for handling responses
  unwrapData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data as T;
  }

  isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
    return response.success;
  }
}

export const apiClient = new ApiClient();