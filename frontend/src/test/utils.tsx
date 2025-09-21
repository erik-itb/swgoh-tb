import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User } from '../types/auth';

// Mock user data
export const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
    createdAt: '2024-01-01T00:00:00Z'
  },
  contributor: {
    id: 2,
    username: 'contributor',
    email: 'contributor@example.com',
    role: 'CONTRIBUTOR' as const,
    createdAt: '2024-01-01T00:00:00Z'
  },
  viewer: {
    id: 3,
    username: 'viewer',
    email: 'viewer@example.com',
    role: 'VIEWER' as const,
    createdAt: '2024-01-01T00:00:00Z'
  }
};

interface TestProviderProps {
  children: React.ReactNode;
  user?: User | null;
  isAuthenticated?: boolean;
}

const TestProvider: React.FC<TestProviderProps> = ({
  children,
  user = null,
  isAuthenticated = false
}) => {
  React.useEffect(() => {
    useAuthStore.setState({
      user,
      isAuthenticated,
      token: isAuthenticated ? 'mock-token' : null
    });
  }, [user, isAuthenticated]);

  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
  isAuthenticated?: boolean;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { user, isAuthenticated, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProvider user={user} isAuthenticated={isAuthenticated}>
      {children}
    </TestProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };