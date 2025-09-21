import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthData, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/auth.service';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          const authData = await authService.login(credentials);

          set({
            user: authData.user,
            token: authData.token,
            refreshToken: authData.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          const authData = await authService.register(data);

          set({
            user: authData.user,
            token: authData.token,
            refreshToken: authData.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAuth: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const newToken = await authService.refreshToken(refreshToken);
          set({ token: newToken });
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          const updatedUser = await authService.updateProfile(data);

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Profile update failed',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: () => {
        const { token } = get();
        if (token) {
          set({ isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);