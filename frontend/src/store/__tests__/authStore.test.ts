import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { api } from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('login', () => {
    const mockLoginResponse = {
      data: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'VIEWER'
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      }
    };

    test('should login successfully with valid credentials', async () => {
      const mockedApi = vi.mocked(api);
      mockedApi.post.mockResolvedValueOnce(mockLoginResponse);

      const { login } = useAuthStore.getState();
      const result = await login({
        username: 'testuser',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123'
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockLoginResponse.data.user);
      expect(state.token).toBe(mockLoginResponse.data.token);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should handle login failure', async () => {
      const mockedApi = vi.mocked(api);
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: { error: 'Invalid credentials' }
        }
      });

      const { login } = useAuthStore.getState();
      const result = await login({
        username: 'testuser',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');

      // Check store state remains unchanged
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    const mockRegisterResponse = {
      data: {
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          role: 'VIEWER'
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      }
    };

    test('should register successfully', async () => {
      const mockedApi = vi.mocked(api);
      mockedApi.post.mockResolvedValueOnce(mockRegisterResponse);

      const { register } = useAuthStore.getState();
      const result = await register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockRegisterResponse.data.user);
      expect(state.token).toBe(mockRegisterResponse.data.token);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should handle registration failure', async () => {
      const mockedApi = vi.mocked(api);
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: { error: 'Username already exists' }
        }
      });

      const { register } = useAuthStore.getState();
      const result = await register({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username already exists');

      // Check store state remains unchanged
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    test('should clear user data on logout', () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'VIEWER',
          createdAt: '2024-01-01T00:00:00Z'
        },
        token: 'mock-token',
        isAuthenticated: true
      });

      const { logout } = useAuthStore.getState();
      logout();

      // Check store state is cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    test('should validate existing token and update user data', async () => {
      const mockProfileResponse = {
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'VIEWER',
          createdAt: '2024-01-01T00:00:00Z'
        }
      };

      // Set initial token
      useAuthStore.setState({
        token: 'existing-token'
      });

      const mockedApi = vi.mocked(api);
      mockedApi.get.mockResolvedValueOnce(mockProfileResponse);

      const { checkAuth } = useAuthStore.getState();
      await checkAuth();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/profile');

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockProfileResponse.data);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should handle invalid token', async () => {
      // Set initial token
      useAuthStore.setState({
        token: 'invalid-token'
      });

      const mockedApi = vi.mocked(api);
      mockedApi.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      const { checkAuth } = useAuthStore.getState();
      await checkAuth();

      // Check store state is cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('hasRole', () => {
    test('should check user roles correctly', () => {
      const { hasRole } = useAuthStore.getState();

      // Test with no user
      expect(hasRole('ADMIN')).toBe(false);

      // Set user with CONTRIBUTOR role
      useAuthStore.setState({
        user: {
          id: 1,
          username: 'contributor',
          email: 'contributor@example.com',
          role: 'CONTRIBUTOR',
          createdAt: '2024-01-01T00:00:00Z'
        },
        isAuthenticated: true
      });

      expect(hasRole('VIEWER')).toBe(true);
      expect(hasRole('CONTRIBUTOR')).toBe(true);
      expect(hasRole('ADMIN')).toBe(false);
      expect(hasRole('SUPER_ADMIN')).toBe(false);

      // Set user with ADMIN role
      useAuthStore.setState({
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
          createdAt: '2024-01-01T00:00:00Z'
        },
        isAuthenticated: true
      });

      expect(hasRole('VIEWER')).toBe(true);
      expect(hasRole('CONTRIBUTOR')).toBe(true);
      expect(hasRole('ADMIN')).toBe(true);
      expect(hasRole('SUPER_ADMIN')).toBe(false);
    });
  });
});