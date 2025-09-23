/**
 * Advanced Asset Cache Service
 * Implements sophisticated caching strategies for optimal performance
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  totalAccesses: number;
  hits: number;
  misses: number;
  entries: Record<string, {
    accessCount: number;
    lastAccessed: number;
    size: number;
  }>;
}

interface CacheConfig {
  maxSize: number; // Maximum number of entries
  defaultTtl: number; // Default TTL in milliseconds
  maxMemoryUsage: number; // Maximum memory usage in MB
  enablePersistence: boolean; // Use localStorage for persistence
  enableCompression: boolean; // Compress cached data
}

class AssetCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    totalAccesses: 0,
    hits: 0,
    misses: 0
  };

  private config: CacheConfig = {
    maxSize: 1000,
    defaultTtl: 60 * 60 * 1000, // 1 hour
    maxMemoryUsage: 50, // 50MB
    enablePersistence: true,
    enableCompression: false
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
    this.loadFromPersistence();
    this.startCleanupInterval();
  }

  /**
   * Get cached data with automatic cleanup
   */
  get(key: string): any | null {
    this.stats.totalAccesses++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  /**
   * Set cached data with TTL and size management
   */
  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.config.defaultTtl);

    const entry: CacheEntry = {
      data: this.config.enableCompression ? this.compress(data) : data,
      timestamp: Date.now(),
      expiry,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Check cache size limits
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    // Check memory usage
    if (this.getEstimatedMemoryUsage() >= this.config.maxMemoryUsage * 1024 * 1024) {
      this.evictLargestEntries();
    }

    this.cache.set(key, entry);
    this.saveToPersistence();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.saveToPersistence();
    return result;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { totalAccesses: 0, hits: 0, misses: 0 };
    this.clearPersistence();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate = this.stats.totalAccesses > 0
      ? (this.stats.hits / this.stats.totalAccesses) * 100
      : 0;

    const missRate = this.stats.totalAccesses > 0
      ? (this.stats.misses / this.stats.totalAccesses) * 100
      : 0;

    const entries: Record<string, any> = {};
    this.cache.forEach((entry, key) => {
      entries[key] = {
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        size: this.getEntrySize(entry)
      };
    });

    return {
      size: this.cache.size,
      hitRate: parseFloat(hitRate.toFixed(2)),
      missRate: parseFloat(missRate.toFixed(2)),
      totalAccesses: this.stats.totalAccesses,
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries
    };
  }

  /**
   * Preload multiple assets
   */
  async preload(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (this.has(key)) return; // Already cached

      try {
        const data = await loader(key);
        this.set(key, data);
      } catch (error) {
        console.warn(`Failed to preload asset ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Batch get operation
   */
  getBatch(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    keys.forEach(key => {
      const data = this.get(key);
      if (data !== null) {
        result[key] = data;
      }
    });
    return result;
  }

  /**
   * Batch set operation
   */
  setBatch(entries: Record<string, any>, ttl?: number): void {
    Object.entries(entries).forEach(([key, data]) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * Get cache keys matching pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;

    const regex = new RegExp(pattern);
    return keys.filter(key => regex.test(key));
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.saveToPersistence();
    }

    return cleaned;
  }

  /**
   * Get estimated memory usage in bytes
   */
  private getEstimatedMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += this.getEntrySize(entry);
    });
    return totalSize;
  }

  /**
   * Get estimated size of cache entry in bytes
   */
  private getEntrySize(entry: CacheEntry): number {
    try {
      return JSON.stringify(entry).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default fallback size
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Evict largest entries when memory limit exceeded
   */
  private evictLargestEntries(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => this.getEntrySize(b[1]) - this.getEntrySize(a[1]));

    // Remove largest entries until under memory limit
    let currentUsage = this.getEstimatedMemoryUsage();
    const maxUsage = this.config.maxMemoryUsage * 1024 * 1024;

    for (const [key, entry] of entries) {
      if (currentUsage <= maxUsage) break;

      this.cache.delete(key);
      currentUsage -= this.getEntrySize(entry);
    }
  }

  /**
   * Compress data for storage (placeholder implementation)
   */
  private compress(data: any): any {
    // In a real implementation, you might use a compression library
    // For now, just return the data as-is
    return data;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  /**
   * Save cache to localStorage for persistence
   */
  private saveToPersistence(): void {
    if (!this.config.enablePersistence) return;

    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now()
      };

      localStorage.setItem('assetCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromPersistence(): void {
    if (!this.config.enablePersistence) return;

    try {
      const cached = localStorage.getItem('assetCache');
      if (!cached) return;

      const cacheData = JSON.parse(cached);

      // Check if cache is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - cacheData.timestamp > maxAge) {
        this.clearPersistence();
        return;
      }

      // Restore cache entries
      this.cache = new Map(cacheData.entries);
      this.stats = cacheData.stats || { totalAccesses: 0, hits: 0, misses: 0 };

      // Clean expired entries
      this.cleanup();
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      this.clearPersistence();
    }
  }

  /**
   * Clear persistence storage
   */
  private clearPersistence(): void {
    try {
      localStorage.removeItem('assetCache');
    } catch (error) {
      console.warn('Failed to clear cache persistence:', error);
    }
  }
}

// Export singleton instance with default configuration
export const assetCache = new AssetCacheService({
  maxSize: 500,
  defaultTtl: 60 * 60 * 1000, // 1 hour
  maxMemoryUsage: 25, // 25MB
  enablePersistence: true,
  enableCompression: false
});

// Export class for custom instances
export { AssetCacheService };