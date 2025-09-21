import React from 'react';
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Target,
  Star,
  MapPin,
  Shield,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { cn } from '../../utils/helpers';

interface ContentStats {
  territoryBattles: number;
  phases: number;
  planets: number;
  missions: number;
  squads: number;
  publishedSquads: number;
  pendingSquads: number;
}

type ContentSection = 'overview' | 'territory-battles' | 'squads' | 'data-management';

export const ContentManagement: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState<ContentSection>('overview');
  const [stats, setStats] = React.useState<ContentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadContentStats();
  }, []);

  const loadContentStats = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStats({
      territoryBattles: 2,
      phases: 12,
      planets: 36,
      missions: 54,
      squads: 328,
      publishedSquads: 289,
      pendingSquads: 39
    });
    setIsLoading(false);
  };

  const sections = [
    {
      id: 'overview' as ContentSection,
      name: 'Overview',
      icon: Database,
      description: 'Content statistics and overview'
    },
    {
      id: 'territory-battles' as ContentSection,
      name: 'Territory Battles',
      icon: Shield,
      description: 'Manage TB phases and missions'
    },
    {
      id: 'squads' as ContentSection,
      name: 'Squad Management',
      icon: Star,
      description: 'Review and manage squads'
    },
    {
      id: 'data-management' as ContentSection,
      name: 'Data Management',
      icon: Upload,
      description: 'Import/export and bulk operations'
    }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return <ContentOverview stats={stats} />;
      case 'territory-battles':
        return <TerritoryBattleManagement />;
      case 'squads':
        return <SquadManagement />;
      case 'data-management':
        return <DataManagement />;
      default:
        return <ContentOverview stats={stats} />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-neutral-700">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200',
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600'
                )}
              >
                <Icon
                  className={cn(
                    'mr-2 h-4 w-4 transition-colors',
                    activeSection === section.id
                      ? 'text-blue-400'
                      : 'text-neutral-500 group-hover:text-neutral-400'
                  )}
                />
                <div className="text-left">
                  <div>{section.name}</div>
                  <div className="text-xs text-neutral-500 group-hover:text-neutral-400">
                    {section.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Section Content */}
      <div>{renderSectionContent()}</div>
    </div>
  );
};

// Content Overview Component
const ContentOverview: React.FC<{ stats: ContentStats | null }> = ({ stats }) => {
  if (!stats) return <LoadingSpinner size="lg" />;

  const overviewCards = [
    {
      title: 'Territory Battles',
      value: stats.territoryBattles,
      icon: Shield,
      color: 'purple',
      details: `${stats.phases} phases, ${stats.planets} planets`
    },
    {
      title: 'Combat Missions',
      value: stats.missions,
      icon: Target,
      color: 'red',
      details: 'Active mission configurations'
    },
    {
      title: 'Total Squads',
      value: stats.squads,
      icon: Star,
      color: 'amber',
      details: `${stats.publishedSquads} published, ${stats.pendingSquads} pending`
    },
    {
      title: 'Published Content',
      value: Math.round((stats.publishedSquads / stats.squads) * 100),
      icon: Eye,
      color: 'green',
      details: `${stats.publishedSquads}/${stats.squads} squads public`,
      suffix: '%'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple': return 'text-purple-400 border-purple-500/30 bg-purple-900/10';
      case 'red': return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'amber': return 'text-amber-400 border-amber-500/30 bg-amber-900/10';
      case 'green': return 'text-green-400 border-green-500/30 bg-green-900/10';
      default: return 'text-neutral-400 border-neutral-500/30 bg-neutral-900/10';
    }
  };

  return (
    <div className="space-y-8">
      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          const colorClass = getColorClasses(card.color);

          return (
            <div key={card.title} className={`card border ${colorClass}`}>
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-6 w-6 ${colorClass.split(' ')[0]}`} />
                  <span className="text-2xl font-bold text-white">
                    {card.value}{card.suffix || ''}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-white mb-1">{card.title}</h3>
                <p className="text-xs text-neutral-400">{card.details}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center space-x-2">
              <Plus size={16} />
              <span>Add Mission</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <Eye size={16} />
              <span>Review Squads</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <Upload size={16} />
              <span>Import Data</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <RefreshCw size={16} />
              <span>Sync Content</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Territory Battle Management Component
const TerritoryBattleManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Territory Battle Management</h3>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>Add Territory Battle</span>
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Territory Battle Editor</h3>
            <p className="text-neutral-400 mb-6">
              Advanced TB management tools will be available here for editing phases, planets, and missions.
            </p>
            <button className="btn-primary">
              Open TB Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Squad Management Component
const SquadManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Squad Management</h3>
        <div className="flex space-x-2">
          <button className="btn-secondary flex items-center space-x-2">
            <Eye size={16} />
            <span>Review Pending</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Star size={16} />
            <span>Featured Squads</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Squad Review Tools</h3>
            <p className="text-neutral-400 mb-6">
              Advanced squad management and moderation tools for reviewing community contributions.
            </p>
            <button className="btn-primary">
              Open Squad Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Data Management Component
const DataManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Data Management</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h4 className="text-md font-semibold text-white">Import/Export</h4>
          </div>
          <div className="card-content space-y-4">
            <button className="w-full btn-primary flex items-center justify-center space-x-2">
              <Upload size={16} />
              <span>Import TB Data</span>
            </button>
            <button className="w-full btn-secondary flex items-center justify-center space-x-2">
              <Download size={16} />
              <span>Export Squad Data</span>
            </button>
            <button className="w-full btn-secondary flex items-center justify-center space-x-2">
              <RefreshCw size={16} />
              <span>Sync with External API</span>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="text-md font-semibold text-white">Bulk Operations</h4>
          </div>
          <div className="card-content space-y-4">
            <button className="w-full btn-secondary flex items-center justify-center space-x-2">
              <Eye size={16} />
              <span>Bulk Publish Squads</span>
            </button>
            <button className="w-full btn-secondary flex items-center justify-center space-x-2">
              <EyeOff size={16} />
              <span>Bulk Unpublish Squads</span>
            </button>
            <button className="w-full btn-danger flex items-center justify-center space-x-2">
              <Trash2 size={16} />
              <span>Clean Inactive Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};