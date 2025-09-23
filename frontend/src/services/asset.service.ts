/**
 * Frontend Asset Service for SWGoH assets
 * Handles caching, progressive loading, and API integration
 */

import { assetCache } from './asset-cache.service';

export interface AssetInfo {
  url: string;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  lastUpdated?: string;
}

export interface UnitAssets {
  gameId: string;
  portraits: {
    sm?: AssetInfo;
    md?: AssetInfo;
    lg?: AssetInfo;
  };
  icons: {
    md?: AssetInfo;
  };
}

export interface AssetManifest {
  generated: string;
  version: string;
  baseUrl: string;
  assets: Array<{
    gameId: string;
    name: string;
    type: string;
    urls: {
      portrait: string;
      icon: string;
    };
  }>;
}

export type AssetSize = 'sm' | 'md' | 'lg';

class AssetService {
  private static instance: AssetService;
  private manifest: AssetManifest | null = null;
  private baseUrl = '/api/assets';

  public static getInstance(): AssetService {
    if (!AssetService.instance) {
      AssetService.instance = new AssetService();
    }
    return AssetService.instance;
  }

  /**
   * Get unit portrait URL with size and caching
   */
  async getUnitPortrait(gameId: string, size: AssetSize = 'md'): Promise<string | null> {
    const cacheKey = `portrait:${gameId}:${size}`;

    // Check cache first
    const cached = assetCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/unit/${gameId}/portrait?size=${size}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const url = data.url;

      // Cache the result with 1 hour TTL
      assetCache.set(cacheKey, url, 60 * 60 * 1000);

      return url;
    } catch (error) {
      console.error('Error fetching unit portrait:', error);
      return null;
    }
  }

  /**
   * Get unit icon URL with caching
   */
  async getUnitIcon(gameId: string): Promise<string | null> {
    const cacheKey = `icon:${gameId}`;

    const cached = assetCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/unit/${gameId}/icon`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const url = data.url;

      assetCache.set(cacheKey, url, 60 * 60 * 1000);

      return url;
    } catch (error) {
      console.error('Error fetching unit icon:', error);
      return null;
    }
  }

  /**
   * Get comprehensive unit asset information
   */
  async getUnitAssets(gameId: string): Promise<UnitAssets | null> {
    const cacheKey = `assets:${gameId}`;

    const cached = assetCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/unit/${gameId}/assets`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      assetCache.set(cacheKey, data, 60 * 60 * 1000);

      return data;
    } catch (error) {
      console.error('Error fetching unit assets:', error);
      return null;
    }
  }

  /**
   * Preload critical assets for better performance
   */
  async preloadAssets(gameIds: string[]): Promise<void> {
    // Use advanced cache preloading
    const portraitKeys = gameIds.map(id => `portrait:${id}:md`);
    const iconKeys = gameIds.map(id => `icon:${id}`);

    await Promise.all([
      assetCache.preload(portraitKeys, async (key) => {
        const gameId = key.split(':')[1];
        return this.getUnitPortrait(gameId, 'md');
      }),
      assetCache.preload(iconKeys, async (key) => {
        const gameId = key.split(':')[1];
        return this.getUnitIcon(gameId);
      })
    ]);
  }

  /**
   * Get asset manifest for bulk operations
   */
  async getManifest(): Promise<AssetManifest | null> {
    if (this.manifest) {
      return this.manifest;
    }

    try {
      const response = await fetch(`${this.baseUrl}/manifest`);

      if (!response.ok) {
        return null;
      }

      this.manifest = await response.json();

      // Cache manifest for 24 hours
      setTimeout(() => { this.manifest = null; }, 24 * 60 * 60 * 1000);

      return this.manifest;
    } catch (error) {
      console.error('Error fetching asset manifest:', error);
      return null;
    }
  }

  /**
   * Get fallback asset URLs
   */
  getFallbackPortrait(): string {
    return '/assets/fallback/character-portrait.png';
  }

  getFallbackIcon(): string {
    return '/assets/fallback/character-icon.png';
  }

  /**
   * Clear cache (useful for debugging)
   */
  clearCache(): void {
    assetCache.clear();
    this.manifest = null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return assetCache.getStats();
  }

  /**
   * Progressive image loading with multiple sizes
   */
  async getProgressiveImageUrls(gameId: string): Promise<{
    placeholder: string;
    small: string;
    medium: string;
    large: string;
  }> {
    const [smallUrl, mediumUrl, largeUrl] = await Promise.all([
      this.getUnitPortrait(gameId, 'sm'),
      this.getUnitPortrait(gameId, 'md'),
      this.getUnitPortrait(gameId, 'lg')
    ]);

    return {
      placeholder: this.getFallbackPortrait(),
      small: smallUrl || this.getFallbackPortrait(),
      medium: mediumUrl || this.getFallbackPortrait(),
      large: largeUrl || this.getFallbackPortrait()
    };
  }

  /**
   * Batch load multiple unit assets
   */
  async batchLoadUnitAssets(gameIds: string[]): Promise<Map<string, UnitAssets>> {
    const results = new Map<string, UnitAssets>();

    const promises = gameIds.map(async (gameId) => {
      try {
        const assets = await this.getUnitAssets(gameId);
        if (assets) {
          results.set(gameId, assets);
        }
      } catch (error) {
        console.error(`Error loading assets for ${gameId}:`, error);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Check asset health
   */
  async checkAssetHealth(): Promise<{
    total: number;
    active: number;
    recentlyUpdated: number;
    byType: Record<string, number>;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking asset health:', error);
      return null;
    }
  }

  /**
   * Search assets by criteria
   */
  async searchAssets(criteria: {
    assetType?: string;
    gameId?: string;
    format?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    assets: any[];
    pagination: {
      total: number;
      hasMore: boolean;
    };
  } | null> {
    try {
      const params = new URLSearchParams();

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching assets:', error);
      return null;
    }
  }
}

// Export singleton instance
export const assetService = AssetService.getInstance();

// Export for testing/debugging
export { AssetService };