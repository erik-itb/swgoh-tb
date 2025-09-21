import React from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Bell,
  Database,
  Globe,
  Lock,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  moderateSquads: boolean;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  maxSquadsPerUser: number;
  sessionTimeout: number;
}

export const SystemSettings: React.FC = () => {
  const [config, setConfig] = React.useState<SystemConfig>({
    siteName: 'Rise of the Empire TB Tracker',
    siteDescription: 'Community-driven Territory Battle squad recommendations',
    allowRegistration: true,
    requireEmailVerification: false,
    moderateSquads: true,
    enableNotifications: true,
    maintenanceMode: false,
    maxSquadsPerUser: 50,
    sessionTimeout: 7200 // 2 hours in seconds
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHasUnsavedChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    }
    setIsSaving(false);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      // Reset to default values
      setConfig({
        siteName: 'Rise of the Empire TB Tracker',
        siteDescription: 'Community-driven Territory Battle squad recommendations',
        allowRegistration: true,
        requireEmailVerification: false,
        moderateSquads: true,
        enableNotifications: true,
        maintenanceMode: false,
        maxSquadsPerUser: 50,
        sessionTimeout: 7200
      });
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">System Settings</h2>
        <div className="flex items-center space-x-3">
          {saveStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-400">
              <Check size={16} />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-400">
              <X size={16} />
              <span className="text-sm">Save failed</span>
            </div>
          )}
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <h3 className="text-amber-300 font-medium">Unsaved Changes</h3>
            <p className="text-amber-200 text-sm">
              You have unsaved changes. Make sure to save your settings before leaving this page.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">General Settings</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => handleConfigChange('siteName', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Site Description
              </label>
              <textarea
                value={config.siteDescription}
                onChange={(e) => handleConfigChange('siteDescription', e.target.value)}
                rows={3}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Max Squads per User
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={config.maxSquadsPerUser}
                onChange={(e) => handleConfigChange('maxSquadsPerUser', parseInt(e.target.value))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Session Timeout (seconds)
              </label>
              <input
                type="number"
                min="300"
                max="86400"
                value={config.sessionTimeout}
                onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                className="input w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Current: {Math.floor(config.sessionTimeout / 3600)}h {Math.floor((config.sessionTimeout % 3600) / 60)}m
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Security Settings</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-300">
                  Allow Registration
                </label>
                <p className="text-xs text-neutral-500">
                  Allow new users to create accounts
                </p>
              </div>
              <button
                onClick={() => handleConfigChange('allowRegistration', !config.allowRegistration)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.allowRegistration ? 'bg-blue-600' : 'bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.allowRegistration ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-300">
                  Require Email Verification
                </label>
                <p className="text-xs text-neutral-500">
                  New users must verify their email
                </p>
              </div>
              <button
                onClick={() => handleConfigChange('requireEmailVerification', !config.requireEmailVerification)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.requireEmailVerification ? 'bg-blue-600' : 'bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-300">
                  Moderate Squads
                </label>
                <p className="text-xs text-neutral-500">
                  Require admin approval for squad publishing
                </p>
              </div>
              <button
                onClick={() => handleConfigChange('moderateSquads', !config.moderateSquads)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.moderateSquads ? 'bg-blue-600' : 'bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.moderateSquads ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">System Settings</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-300">
                  Enable Notifications
                </label>
                <p className="text-xs text-neutral-500">
                  Send system notifications to users
                </p>
              </div>
              <button
                onClick={() => handleConfigChange('enableNotifications', !config.enableNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.enableNotifications ? 'bg-blue-600' : 'bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-300">
                  Maintenance Mode
                </label>
                <p className="text-xs text-neutral-500">
                  Disable public access for maintenance
                </p>
              </div>
              <button
                onClick={() => handleConfigChange('maintenanceMode', !config.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.maintenanceMode ? 'bg-red-600' : 'bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.maintenanceMode && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Maintenance Mode Active</span>
                </div>
                <p className="text-red-200 text-sm mt-1">
                  The site is currently in maintenance mode. Only administrators can access the system.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* API & Integration */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">API & Integration</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">API Configuration</h4>
              <p className="text-neutral-400 mb-4">
                Advanced API settings and third-party integrations will be available here.
              </p>
              <button className="btn-secondary">
                Configure API Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card border-neutral-600">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-white">System Information</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-neutral-400 mb-1">Application Version</div>
              <div className="text-white font-medium">v1.0.0</div>
            </div>
            <div>
              <div className="text-neutral-400 mb-1">Database Version</div>
              <div className="text-white font-medium">PostgreSQL 15.2</div>
            </div>
            <div>
              <div className="text-neutral-400 mb-1">Last Backup</div>
              <div className="text-white font-medium">2 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};