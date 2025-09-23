/**
 * Service Worker Registration and Management
 * Handles registration, updates, and communication with asset caching service worker
 */

interface ServiceWorkerManager {
  register(): Promise<void>;
  unregister(): Promise<boolean>;
  update(): Promise<void>;
  cacheAssets(urls: string[]): Promise<void>;
  clearCache(pattern?: string): Promise<void>;
  getCacheInfo(): Promise<any>;
  isSupported(): boolean;
}

class AssetServiceWorkerManager implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  /**
   * Check if service workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Register the asset service worker
   */
  async register(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw-assets.js', {
        scope: '/'
      });

      console.log('Asset SW registered:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New asset SW available');
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Handle controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Asset SW controller changed');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

    } catch (error) {
      console.error('Asset SW registration failed:', error);
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Asset SW unregistration failed:', error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registered');
    }

    try {
      await this.registration.update();
      console.log('Asset SW update checked');
    } catch (error) {
      console.error('Asset SW update failed:', error);
    }
  }

  /**
   * Send message to service worker to cache assets
   */
  async cacheAssets(urls: string[]): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('No active service worker');
    }

    this.registration.active.postMessage({
      type: 'CACHE_ASSETS',
      data: { urls }
    });

    console.log('Requested caching of', urls.length, 'assets');
  }

  /**
   * Clear cache with optional pattern
   */
  async clearCache(pattern?: string): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('No active service worker');
    }

    this.registration.active.postMessage({
      type: 'CLEAR_CACHE',
      data: { pattern }
    });

    console.log('Requested cache clear', pattern ? `for pattern: ${pattern}` : '(all)');
  }

  /**
   * Get cache information from service worker
   */
  async getCacheInfo(): Promise<any> {
    if (!this.registration?.active) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_INFO' },
        [channel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Cache info request timeout'));
      }, 5000);
    });
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  /**
   * Apply pending update
   */
  async applyUpdate(): Promise<void> {
    if (!this.registration?.waiting) {
      throw new Error('No pending update');
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Asset cache updated:', data);
        this.dispatchCacheEvent('updated', data);
        break;

      case 'CACHE_ERROR':
        console.error('Asset cache error:', data);
        this.dispatchCacheEvent('error', data);
        break;

      default:
        console.log('Unknown SW message:', type, data);
    }
  }

  /**
   * Notify about update availability
   */
  private notifyUpdateAvailable(): void {
    this.dispatchCacheEvent('updateavailable', {
      message: 'New version of asset cache available'
    });
  }

  /**
   * Dispatch custom cache events
   */
  private dispatchCacheEvent(type: string, detail: any): void {
    const event = new CustomEvent(`assetcache-${type}`, { detail });
    window.dispatchEvent(event);
  }
}

// Singleton instance
export const serviceWorkerManager = new AssetServiceWorkerManager();

// Auto-register in production
if (import.meta.env.PROD) {
  serviceWorkerManager.register().catch(console.error);
}

// Export utilities
export const registerAssetServiceWorker = () => serviceWorkerManager.register();
export const unregisterAssetServiceWorker = () => serviceWorkerManager.unregister();
export const updateAssetServiceWorker = () => serviceWorkerManager.update();
export const cacheAssets = (urls: string[]) => serviceWorkerManager.cacheAssets(urls);
export const clearAssetCache = (pattern?: string) => serviceWorkerManager.clearCache(pattern);
export const getAssetCacheInfo = () => serviceWorkerManager.getCacheInfo();

// Event listeners for cache management
export const onAssetCacheUpdated = (callback: (detail: any) => void) => {
  window.addEventListener('assetcache-updated', (event: any) => callback(event.detail));
};

export const onAssetCacheError = (callback: (detail: any) => void) => {
  window.addEventListener('assetcache-error', (event: any) => callback(event.detail));
};

export const onAssetCacheUpdateAvailable = (callback: (detail: any) => void) => {
  window.addEventListener('assetcache-updateavailable', (event: any) => callback(event.detail));
};