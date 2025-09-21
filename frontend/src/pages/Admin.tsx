import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Target,
  Star,
  Database,
  Settings,
  BarChart3,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTBStore } from '../store/tbStore';
import { useSquadStore } from '../store/squadStore';
import { LoadingOverlay } from '../components/common/LoadingSpinner';
import { AdminStats } from '../components/admin/AdminStats';
import { UserManagement } from '../components/admin/UserManagement';
import { ContentManagement } from '../components/admin/ContentManagement';
import { SystemSettings } from '../components/admin/SystemSettings';
import { cn } from '../utils/helpers';

type AdminTab = 'overview' | 'users' | 'content' | 'settings';

export const Admin: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('overview');

  // Check if user has admin access
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    {
      id: 'overview' as AdminTab,
      name: 'Overview',
      icon: BarChart3,
      description: 'System statistics and analytics'
    },
    {
      id: 'users' as AdminTab,
      name: 'Users',
      icon: Users,
      description: 'User management and roles'
    },
    {
      id: 'content' as AdminTab,
      name: 'Content',
      icon: Database,
      description: 'TB data and squad management'
    },
    {
      id: 'settings' as AdminTab,
      name: 'Settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminStats />;
      case 'users':
        return <UserManagement />;
      case 'content':
        return <ContentManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-red-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-neutral-300">System administration and content management</p>
          </div>
        </div>

        {/* Admin Alert */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-300 font-medium">Administrator Access</h3>
            <p className="text-red-200 text-sm">
              You have {user.role.toLowerCase()} privileges. Use these tools responsibly to manage the community.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600'
                )}
              >
                <Icon
                  className={cn(
                    'mr-2 h-5 w-5 transition-colors',
                    activeTab === tab.id
                      ? 'text-blue-400'
                      : 'text-neutral-500 group-hover:text-neutral-400'
                  )}
                />
                <div className="text-left">
                  <div>{tab.name}</div>
                  <div className="text-xs text-neutral-500 group-hover:text-neutral-400">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>

      {/* Footer Warning */}
      <div className="mt-12 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
        <div className="flex items-center space-x-2 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Important:</span>
        </div>
        <p className="text-amber-200 text-sm mt-1">
          Changes made in the admin dashboard affect all users. Always verify your actions before confirming.
          For critical operations, consider backing up data first.
        </p>
      </div>
    </div>
  );
};