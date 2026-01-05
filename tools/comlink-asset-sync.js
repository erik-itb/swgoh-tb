#!/usr/bin/env node

/**
 * SWGoH Comlink Asset Sync
 * 
 * Syncs unit portraits and generates a units manifest with display names.
 * Designed to run locally during build - no Comlink needed on production.
 * 
 * Usage: node tools/comlink-asset-sync.js [--force]
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  comlinkUrl: process.env.COMLINK_URL || 'http://localhost:3200',
  assetExtractorUrl: process.env.ASSET_EXTRACTOR_URL || 'http://localhost:3001',
  publicDir: path.resolve(__dirname, '../public'),
  dataDir: path.resolve(__dirname, '../data'),
  charactersDir: path.resolve(__dirname, '../public/characters'),
  shipsDir: path.resolve(__dirname, '../public/ships'),
  manifestPath: path.resolve(__dirname, '../data/units-manifest.json'),
  syncStatePath: path.resolve(__dirname, '../data/sync-state.json'),
};

class ComlinkAssetSync {
  constructor() {
    this.stats = {
      unitsProcessed: 0,
      assetsDownloaded: 0,
      assetsSkipped: 0,
      assetsFailed: 0,
      errors: []
    };
    this.forceSync = process.argv.includes('--force');
  }

  log(message, level = 'info') {
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      download: '📥'
    }[level] || '•';
    console.log(`${prefix} ${message}`);
  }

  /**
   * POST request to Comlink API
   */
  async comlinkPost(endpoint, body = {}) {
    try {
      const response = await fetch(`${CONFIG.comlinkUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Comlink ${endpoint} failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      if (error.cause?.code === 'ECONNREFUSED') {
        throw new Error(`Comlink not running at ${CONFIG.comlinkUrl}. Start it with: docker start swgoh-comlink`);
      }
      throw error;
    }
  }

  /**
   * Get metadata including game data version
   */
  async getMetadata() {
    this.log('Fetching game metadata from Comlink...');
    const metadata = await this.comlinkPost('/metadata', {});
    this.log(`Game version: ${metadata.latestGamedataVersion}`, 'success');
    return metadata;
  }

  /**
   * Get localization bundle and parse it
   */
  async getLocalization(version) {
    this.log('Fetching English localization bundle...');
    const locData = await this.comlinkPost('/localization', {
      payload: { id: `${version}:ENG_US` },
      unzip: true
    });
    
    // The localization bundle contains files - we need to parse Loc_ENG_US.txt
    // It's a key=value format
    let locBundle = {};
    
    if (locData['Loc_ENG_US.txt']) {
      const lines = locData['Loc_ENG_US.txt'].split('\n');
      for (const line of lines) {
        const eqIdx = line.indexOf('|');
        if (eqIdx > 0) {
          const key = line.substring(0, eqIdx).trim();
          const value = line.substring(eqIdx + 1).trim();
          locBundle[key] = value;
        }
      }
      this.log(`Loaded ${Object.keys(locBundle).length} localization strings`, 'success');
    } else {
      this.log('Localization format unexpected, using fallback names', 'warning');
    }
    
    return locBundle;
  }

  /**
   * Get all units from game data
   */
  async getUnits(version) {
    this.log('Fetching unit data (this may take a moment)...');
    const gameData = await this.comlinkPost('/data', {
      payload: {
        version: version,
        includePveUnits: false,
        requestSegment: 3  // Segment 3 contains units
      },
      enums: true
    });
    
    const units = gameData.units || [];
    this.log(`Loaded ${units.length} units`, 'success');
    return units;
  }

  /**
   * Check if asset already exists and is valid
   */
  async assetExists(filePath, minSize = 1000) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size >= minSize;
    } catch {
      return false;
    }
  }

  /**
   * Download image with retry logic
   */
  async downloadImage(url, outputPath, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'SWGoH-TB-Tracker/1.0',
            'Accept': 'image/png,image/*'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        
        // Validate PNG signature
        if (buffer.length < 1000 || 
            buffer[0] !== 0x89 || buffer[1] !== 0x50 || 
            buffer[2] !== 0x4E || buffer[3] !== 0x47) {
          throw new Error('Invalid PNG');
        }
        
        await fs.writeFile(outputPath, buffer);
        return { success: true, size: buffer.length };
        
      } catch (error) {
        if (attempt === retries) {
          return { success: false, error: error.message };
        }
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Download asset for a unit using Asset Extractor API
   */
  async downloadUnitAsset(unit, assetVersion) {
    const isShip = unit.combatType === 'SHIP' || unit.combatType === 2;
    const targetDir = isShip ? CONFIG.shipsDir : CONFIG.charactersDir;
    const outputPath = path.join(targetDir, `${unit.baseId}.png`);
    
    // Skip if already exists
    if (!this.forceSync && await this.assetExists(outputPath)) {
      this.stats.assetsSkipped++;
      return { skipped: true };
    }
    
    // Get texture name (e.g., "tex.charui_vader" -> "charui_vader")
    let textureName = unit.thumbnailName || `tex.charui_${unit.baseId.toLowerCase()}`;
    // Remove "tex." prefix if present for the API
    if (textureName.startsWith('tex.')) {
      textureName = textureName.substring(4);
    }
    
    // Use Asset Extractor API
    const url = `${CONFIG.assetExtractorUrl}/Asset/single?assetName=${encodeURIComponent(textureName)}&version=${assetVersion}`;
    const result = await this.downloadImage(url, outputPath);
    
    if (result.success) {
      this.stats.assetsDownloaded++;
      return { success: true, url, size: result.size };
    }
    
    this.stats.assetsFailed++;
    this.stats.errors.push(unit.baseId);
    return { success: false };
  }

  /**
   * Get display name from localization
   */
  getDisplayName(unit, localization) {
    // nameKey is like "UNIT_BADBATCHECHO_NAME"
    const nameKey = unit.nameKey;
    
    if (localization && nameKey && localization[nameKey]) {
      return localization[nameKey];
    }
    
    // Fallback: format the baseId nicely
    return this.formatBaseId(unit.baseId);
  }

  /**
   * Format baseId as readable name (fallback)
   */
  formatBaseId(baseId) {
    if (!baseId) return 'Unknown';
    
    return baseId
      .replace(/_/g, ' ')
      .replace(/([A-Z])([A-Z]+)/g, (_, first, rest) => 
        first + rest.toLowerCase()
      )
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  /**
   * Generate units manifest JSON
   */
  async generateManifest(units, localization, gameVersion) {
    this.log('Generating units manifest...');
    
    const manifest = {
      version: gameVersion,
      generated: new Date().toISOString(),
      description: 'SWGoH unit data - synced from Comlink',
      units: {}
    };
    
    // Use a Map to deduplicate by baseId (units can have multiple rarity entries)
    const baseIdMap = new Map();
    
    for (const unit of units) {
      // Skip if we already have this baseId
      if (!unit.baseId || baseIdMap.has(unit.baseId)) continue;
      
      const isShip = unit.combatType === 'SHIP' || unit.combatType === 2;
      
      baseIdMap.set(unit.baseId, {
        name: this.getDisplayName(unit, localization),
        type: isShip ? 'SHIP' : 'CHARACTER',
        alignment: unit.forceAlignment || 'NEUTRAL',
        thumbnailName: unit.thumbnailName,
        rarity: unit.maxRarity || unit.rarity,
        categories: (unit.categoryId || []).filter(c => !c.startsWith('selftag_'))
      });
    }
    
    // Convert to object
    manifest.units = Object.fromEntries(baseIdMap);
    this.stats.unitsProcessed = baseIdMap.size;
    
    // Write manifest
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.writeFile(CONFIG.manifestPath, JSON.stringify(manifest, null, 2));
    
    this.log(`Manifest generated with ${baseIdMap.size} unique units`, 'success');
    return manifest;
  }

  /**
   * Load previous sync state
   */
  async loadSyncState() {
    try {
      const data = await fs.readFile(CONFIG.syncStatePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Save sync state
   */
  async saveSyncState(gameVersion) {
    const state = {
      lastVersion: gameVersion,
      lastSync: new Date().toISOString(),
      stats: this.stats
    };
    await fs.writeFile(CONFIG.syncStatePath, JSON.stringify(state, null, 2));
  }

  /**
   * Main sync process
   */
  async run() {
    console.log('\n🎮 SWGoH Comlink Asset Sync');
    console.log('===========================\n');
    
    try {
      // Ensure directories exist
      await fs.mkdir(CONFIG.charactersDir, { recursive: true });
      await fs.mkdir(CONFIG.shipsDir, { recursive: true });
      await fs.mkdir(CONFIG.dataDir, { recursive: true });
      
      // Get metadata
      const metadata = await this.getMetadata();
      const gameVersion = metadata.latestGamedataVersion;
      const locVersion = metadata.latestLocalizationBundleVersion;
      // Asset version for Asset Extractor (e.g., 36557)
      const assetVersion = metadata.assetVersion;
      this.log(`Asset version: ${assetVersion}`, 'success');
      
      // Check if sync needed
      const prevState = await this.loadSyncState();
      if (!this.forceSync && prevState?.lastVersion === gameVersion) {
        this.log(`Already synced to version ${gameVersion}`, 'success');
        this.log('Use --force to re-sync anyway');
        return;
      }
      
      // Get localization for display names
      const localization = await this.getLocalization(locVersion);
      
      // Get unit data
      const units = await this.getUnits(gameVersion);
      
      // Filter to unique playable units
      const seenBaseIds = new Set();
      const playableUnits = units.filter(u => {
        if (!u.baseId || seenBaseIds.has(u.baseId)) return false;
        if (u.obtainable === false) return false;
        seenBaseIds.add(u.baseId);
        return true;
      });
      
      this.log(`Processing ${playableUnits.length} unique playable units...`);
      
      // Generate manifest first (doesn't require downloads)
      await this.generateManifest(units, localization, gameVersion);
      
      // Download assets in batches
      const batchSize = 10;
      for (let i = 0; i < playableUnits.length; i += batchSize) {
        const batch = playableUnits.slice(i, i + batchSize);
        
        await Promise.all(batch.map(unit => 
          this.downloadUnitAsset(unit, assetVersion)
        ));
        
        // Progress update every 50 units
        if ((i + batchSize) % 50 === 0 || i + batchSize >= playableUnits.length) {
          const progress = Math.min(i + batchSize, playableUnits.length);
          console.log(`  Progress: ${progress}/${playableUnits.length} | Downloaded: ${this.stats.assetsDownloaded} | Skipped: ${this.stats.assetsSkipped} | Failed: ${this.stats.assetsFailed}`);
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
      }
      
      // Save sync state
      await this.saveSyncState(gameVersion);
      
      // Summary
      console.log('\n🎉 Sync Complete!');
      console.log('=================');
      console.log(`📊 Units in manifest: ${this.stats.unitsProcessed}`);
      console.log(`📥 Assets downloaded: ${this.stats.assetsDownloaded}`);
      console.log(`⏭️  Assets skipped: ${this.stats.assetsSkipped}`);
      console.log(`❌ Assets failed: ${this.stats.assetsFailed}`);
      
      if (this.stats.errors.length > 0) {
        console.log(`\n⚠️  Failed units (${this.stats.errors.length}): ${this.stats.errors.slice(0, 10).join(', ')}${this.stats.errors.length > 10 ? '...' : ''}`);
      }
      
      console.log(`\n📁 Manifest: ${path.relative(process.cwd(), CONFIG.manifestPath)}`);
      console.log(`📁 Characters: ${path.relative(process.cwd(), CONFIG.charactersDir)}`);
      console.log(`📁 Ships: ${path.relative(process.cwd(), CONFIG.shipsDir)}`);
      
    } catch (error) {
      console.error('\n❌ Sync failed:', error.message);
      
      // Check if we have a cached manifest to fall back on
      try {
        await fs.access(CONFIG.manifestPath);
        this.log('Using cached manifest - build can proceed', 'warning');
      } catch {
        this.log('No cached manifest available', 'error');
        process.exit(1);
      }
    }
  }
}

// Run
if (require.main === module) {
  const sync = new ComlinkAssetSync();
  sync.run().catch(console.error);
}

module.exports = ComlinkAssetSync;
