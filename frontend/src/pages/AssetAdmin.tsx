import React, { useState, useEffect } from 'react';
import { assetService } from '../services/asset.service';
import { assetCache } from '../services/asset-cache.service';
import {
  serviceWorkerManager,
  getAssetCacheInfo,
  clearAssetCache,
  cacheAssets
} from '../utils/serviceWorker';

interface AssetStats {
  total: number;
  active: number;
  recentlyUpdated: number;
  byType: Record<string, number>;
  byFormat: Record<string, number>;
}

interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  totalAccesses: number;
  hits: number;
  misses: number;
  entries: Record<string, any>;
}

const AssetAdmin: React.FC = () => {
  const [assetStats, setAssetStats] = useState<AssetStats | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [swCacheInfo, setSwCacheInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cache' | 'health' | 'downloads'>('overview');
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load asset statistics
      const healthResponse = await fetch('/api/assets/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setAssetStats(health);
      }

      // Load cache statistics
      const memoryStats = assetService.getCacheStats();
      setCacheStats(memoryStats);

      // Load service worker cache info
      if (serviceWorkerManager.isSupported()) {
        try {
          const swInfo = await getAssetCacheInfo();
          setSwCacheInfo(swInfo);
        } catch (error) {
          console.log('Service worker cache not available:', error);
        }
      }
    } catch (error) {
      console.error('Error loading asset data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCache = async () => {
    try {
      const response = await fetch('/api/assets/refresh-cache', { method: 'POST' });
      const result = await response.json();
      console.log('Cache refresh result:', result);
      await loadData();
    } catch (error) {
      console.error('Error refreshing cache:', error);
    }
  };

  const handleClearCache = async (type: 'memory' | 'service-worker' | 'all') => {
    try {
      if (type === 'memory' || type === 'all') {
        assetService.clearCache();
      }

      if (type === 'service-worker' || type === 'all') {
        await clearAssetCache();
      }

      await loadData();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const handleDownloadAssets = async () => {
    try {
      setDownloadProgress({ current: 0, total: 100 });

      // Get all units for asset download
      const unitsResponse = await fetch('/api/units');
      if (!unitsResponse.ok) {
        throw new Error('Failed to fetch units');
      }

      const units = await unitsResponse.json();
      const gameIds = units.map((unit: any) => unit.gameId);

      setDownloadProgress({ current: 0, total: gameIds.length });

      // Preload assets through service
      await assetService.preloadAssets(gameIds);

      setDownloadProgress(null);
      await loadData();
    } catch (error) {
      console.error('Error downloading assets:', error);
      setDownloadProgress(null);
    }
  };

  const handleBulkImport = async () => {
    try {
      const response = await fetch('/api/assets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: 'UNIT_PORTRAIT',
          directory: '/app/assets/units/portraits'
        })
      });

      const result = await response.json();
      console.log('Bulk import result:', result);
      await loadData();
    } catch (error) {
      console.error('Error during bulk import:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Asset Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Asset Statistics</h3>
        {assetStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{assetStats.total}</div>
              <div className="text-sm text-gray-600">Total Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{assetStats.active}</div>
              <div className="text-sm text-gray-600">Active Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{assetStats.recentlyUpdated}</div>
              <div className="text-sm text-gray-600">Recently Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(assetStats.byType).length}
              </div>
              <div className="text-sm text-gray-600">Asset Types</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading asset statistics...</div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleRefreshCache}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Cache
          </button>
          <button
            onClick={handleDownloadAssets}
            disabled={downloadProgress !== null}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {downloadProgress ? 'Downloading...' : 'Download Assets'}
          </button>
          <button
            onClick={handleBulkImport}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Bulk Import
          </button>
        </div>

        {downloadProgress && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">
              Downloading assets... {downloadProgress.current} / {downloadProgress.total}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCacheTab = () => (
    <div className="space-y-6">
      {/* Memory Cache Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Memory Cache</h3>
        {cacheStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{cacheStats.size}</div>
              <div className="text-sm text-gray-600">Cached Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{cacheStats.hitRate}%</div>
              <div className="text-sm text-gray-600">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{cacheStats.missRate}%</div>
              <div className="text-sm text-gray-600">Miss Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{cacheStats.totalAccesses}</div>
              <div className="text-sm text-gray-600">Total Accesses</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No cache statistics available</div>
        )}

        <button
          onClick={() => handleClearCache('memory')}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Memory Cache
        </button>
      </div>

      {/* Service Worker Cache */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Service Worker Cache</h3>
        {swCacheInfo ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{swCacheInfo.size}</div>
              <div className="text-sm text-gray-600">Cached Assets</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{swCacheInfo.version}</div>
              <div className="text-sm text-gray-600">Cache Version</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{swCacheInfo.name}</div>
              <div className="text-sm text-gray-600">Cache Name</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Service Worker cache not available</div>
        )}

        <div className="space-x-2">
          <button
            onClick={() => handleClearCache('service-worker')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear SW Cache
          </button>
          <button
            onClick={() => handleClearCache('all')}
            className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
          >
            Clear All Caches
          </button>
        </div>
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-6">
      {/* Asset Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Asset Health</h3>
        {assetStats ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">By Type</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(assetStats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="capitalize">{type.replace('_', ' ').toLowerCase()}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium">By Format</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(assetStats.byFormat).map(([format, count]) => (
                  <div key={format} className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="uppercase">{format}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading health data...</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor SWGoH game assets</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'cache', label: 'Cache Management' },
            { key: 'health', label: 'Asset Health' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'cache' && renderCacheTab()}
            {activeTab === 'health' && renderHealthTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default AssetAdmin;