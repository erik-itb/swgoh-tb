import { describe, test, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render, mockUsers } from '../../../test/utils';
import { Header } from '../Header';

// Mock the auth store
vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn()
  }))
}));

describe('Header Component', () => {
  test('renders navigation links for unauthenticated users', () => {
    render(<Header />);

    expect(screen.getByText('SWGOH TB Tracker')).toBeInTheDocument();
    expect(screen.getByText('Territory Battles')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  test('renders user menu for authenticated users', () => {
    render(<Header />, {
      user: mockUsers.contributor,
      isAuthenticated: true
    });

    expect(screen.getByText('SWGOH TB Tracker')).toBeInTheDocument();
    expect(screen.getByText('Territory Battles')).toBeInTheDocument();
    expect(screen.getByText('Squads')).toBeInTheDocument();
    expect(screen.getByText(mockUsers.contributor.username)).toBeInTheDocument();
  });

  test('renders admin link for admin users', () => {
    render(<Header />, {
      user: mockUsers.admin,
      isAuthenticated: true
    });

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('does not render admin link for non-admin users', () => {
    render(<Header />, {
      user: mockUsers.contributor,
      isAuthenticated: true
    });

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  test('toggles mobile menu when hamburger is clicked', () => {
    render(<Header />);

    const mobileMenuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(mobileMenuButton);

    // Check if mobile menu items are visible
    expect(screen.getAllByText('Territory Battles')).toHaveLength(2); // Desktop + mobile
  });

  test('shows user dropdown when username is clicked', () => {
    render(<Header />, {
      user: mockUsers.contributor,
      isAuthenticated: true
    });

    const usernameButton = screen.getByText(mockUsers.contributor.username);
    fireEvent.click(usernameButton);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('calls logout when logout button is clicked', () => {
    const { useAuthStore } = require('../../../store/authStore');
    const mockLogout = vi.fn();

    useAuthStore.mockReturnValue({
      user: mockUsers.contributor,
      isAuthenticated: true,
      logout: mockLogout
    });

    render(<Header />, {
      user: mockUsers.contributor,
      isAuthenticated: true
    });

    const usernameButton = screen.getByText(mockUsers.contributor.username);
    fireEvent.click(usernameButton);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });
});