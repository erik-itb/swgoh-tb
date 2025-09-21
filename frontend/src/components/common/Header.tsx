import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { APP_NAME, ROUTES } from '../../utils/constants';
import { cn } from '../../utils/helpers';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
    setIsUserMenuOpen(false);
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Territory Battles', href: ROUTES.HOME },
    { name: 'Squads', href: ROUTES.SQUADS },
  ];

  const userNavigation = [
    { name: 'Profile', href: ROUTES.PROFILE, icon: User },
    ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
      ? [{ name: 'Admin', href: ROUTES.ADMIN, icon: Shield }]
      : []),
  ];

  return (
    <header className="bg-neutral-900 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={ROUTES.HOME} className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TB</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActivePage(item.href)
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors"
                >
                  <div className="h-8 w-8 bg-neutral-700 rounded-full flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="hidden sm:block">{user?.username}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg border border-neutral-700 z-50">
                    <div className="py-1">
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                        >
                          <item.icon size={16} className="mr-3" />
                          {item.name}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-neutral-300 hover:text-white transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-neutral-800 border-t border-neutral-700">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium transition-colors',
                  isActivePage(item.href)
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Click overlay to close menus */}
      {(isMenuOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};