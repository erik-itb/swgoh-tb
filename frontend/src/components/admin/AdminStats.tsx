import React from 'react';
import {
  Users,
  Target,
  Star,
  TrendingUp,
  Calendar,
  Activity,
  Database,
  Shield
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface SystemStats {
  users: {
    total: number;
    active: number;
    contributors: number;
    admins: number;
  };
  content: {
    territoryBattles: number;
    missions: number;
    squads: number;
    publishedSquads: number;
  };
  activity: {
    dailyUsers: number;
    weeklySquads: number;
    monthlyContributions: number;
  };
}

export const AdminStats: React.FC = () => {
  const [stats, setStats] = React.useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading stats from API
    const loadStats = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - in real implementation, this would come from backend
      setStats({
        users: {
          total: 1247,
          active: 892,
          contributors: 156,
          admins: 3
        },
        content: {
          territoryBattles: 2,
          missions: 54,
          squads: 328,
          publishedSquads: 289
        },
        activity: {
          dailyUsers: 156,
          weeklySquads: 23,
          monthlyContributions: 89
        }
      });
      setIsLoading(false);
    };

    loadStats();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">Failed to load system statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      icon: Users,
      color: 'blue',
      description: `${stats.users.active} active users`
    },
    {
      title: 'Territory Battles',
      value: stats.content.territoryBattles.toString(),
      icon: Shield,
      color: 'purple',
      description: `${stats.content.missions} total missions`
    },
    {
      title: 'Squad Recommendations',
      value: stats.content.squads.toLocaleString(),
      icon: Star,
      color: 'amber',
      description: `${stats.content.publishedSquads} published`
    },
    {
      title: 'Daily Active Users',
      value: stats.activity.dailyUsers.toLocaleString(),
      icon: Activity,
      color: 'green',
      description: 'Last 24 hours'
    },
    {
      title: 'Contributors',
      value: stats.users.contributors.toString(),
      icon: Target,
      color: 'red',
      description: 'Squad creators'
    },
    {
      title: 'Weekly Squads',
      value: stats.activity.weeklySquads.toString(),
      icon: TrendingUp,
      color: 'emerald',
      description: 'New this week'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
      case 'purple': return 'text-purple-400 border-purple-500/30 bg-purple-900/10';
      case 'amber': return 'text-amber-400 border-amber-500/30 bg-amber-900/10';
      case 'green': return 'text-green-400 border-green-500/30 bg-green-900/10';
      case 'red': return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'emerald': return 'text-emerald-400 border-emerald-500/30 bg-emerald-900/10';
      default: return 'text-neutral-400 border-neutral-500/30 bg-neutral-900/10';
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const colorClass = getColorClasses(stat.color);

            return (
              <div key={stat.title} className={`card border ${colorClass}`}>
                <div className="card-content">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-8 w-8 ${colorClass.split(' ')[0]}`} />
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">{stat.title}</h3>
                  <p className="text-sm text-neutral-400">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">User Breakdown</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Total Users</span>
              <span className="text-white font-medium">{stats.users.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Active Users</span>
              <span className="text-white font-medium">{stats.users.active.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Contributors</span>
              <span className="text-white font-medium">{stats.users.contributors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Administrators</span>
              <span className="text-white font-medium">{stats.users.admins}</span>
            </div>
          </div>
        </div>

        {/* Content Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Content Statistics</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Territory Battles</span>
              <span className="text-white font-medium">{stats.content.territoryBattles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Combat Missions</span>
              <span className="text-white font-medium">{stats.content.missions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Total Squads</span>
              <span className="text-white font-medium">{stats.content.squads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Published Squads</span>
              <span className="text-white font-medium">{stats.content.publishedSquads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {stats.activity.dailyUsers}
              </div>
              <div className="text-sm text-neutral-400">Daily Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {stats.activity.weeklySquads}
              </div>
              <div className="text-sm text-neutral-400">Squads This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 mb-1">
                {stats.activity.monthlyContributions}
              </div>
              <div className="text-sm text-neutral-400">Monthly Contributions</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-green-500/20">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-400 rounded-full"></div>
              <h3 className="text-lg font-semibold text-white">System Status</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Database</span>
                <span className="text-green-400">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">API Response</span>
                <span className="text-green-400">Fast</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Storage</span>
                <span className="text-green-400">Available</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-blue-500/20">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Growth Metrics</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">User Growth</span>
                <span className="text-blue-400">+12% this month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Squad Submissions</span>
                <span className="text-blue-400">+8% this week</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Engagement</span>
                <span className="text-blue-400">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};