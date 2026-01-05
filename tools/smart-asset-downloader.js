#!/usr/bin/env node

/**
 * Smart Asset Downloader
 * Intelligently downloads assets using multiple strategies and sources
 */

const fs = require('fs').promises;
const path = require('path');

class SmartAssetDownloader {
  constructor() {
    this.assetsDir = path.resolve(__dirname, '../assets');
    this.charactersDir = path.resolve(this.assetsDir, 'characters');
    this.shipsDir = path.resolve(this.assetsDir, 'ships');
    
    // Multiple download strategies to maximize success
    this.strategies = [
      {
        name: 'swgoh.help',
        getUrl: (gameId) => `https://api.swgoh.help/image/char/${gameId}`,
        headers: { 'User-Agent': 'SWGoH-TB-Tracker/2.0' },
        timeout: 8000,
        retries: 2
      },
      {
        name: 'swgoh.gg-legacy',
        getUrl: (gameId) => `https://swgoh.gg/static/img/assets/tex.charui_${gameId.toLowerCase()}.png`,
        headers: { 'User-Agent': 'SWGoH-TB-Tracker/2.0' },
        timeout: 5000,
        retries: 1
      },
      {
        name: 'community-cdn',
        getUrl: (gameId) => `https://swgoh-stat-calc.glitch.me/images/units/${gameId}.png`,
        headers: { 'User-Agent': 'SWGoH-TB-Tracker/2.0' },
        timeout: 5000,
        retries: 1
      }
    ];

    // Priority units for Territory Battles (Rise of the Empire focus)
    this.priorityUnits = [
      // Core Rebels (high priority for RotE)
      { gameId: 'COMMANDERLUKESKYWALKER', name: 'Commander Luke Skywalker', type: 'CHARACTER' },
      { gameId: 'PRINCESSLEIA', name: 'Princess Leia', type: 'CHARACTER' },
      { gameId: 'HANSOLO', name: 'Han Solo', type: 'CHARACTER' },
      { gameId: 'CHEWBACCA', name: 'Chewbacca', type: 'CHARACTER' },
      { gameId: 'R2D2_LEGENDARY', name: 'R2-D2', type: 'CHARACTER' },
      { gameId: 'C3POLEGENDARY', name: 'C-3PO', type: 'CHARACTER' },
      
      // Rogue One (essential for RotE)
      { gameId: 'JYNERSO', name: 'Jyn Erso', type: 'CHARACTER' },
      { gameId: 'CASSIANANDOR', name: 'Cassian Andor', type: 'CHARACTER' },
      { gameId: 'K2SO', name: 'K-2SO', type: 'CHARACTER' },
      { gameId: 'CHIRRUT', name: 'Chirrut Îmwe', type: 'CHARACTER' },
      { gameId: 'BAZE', name: 'Baze Malbus', type: 'CHARACTER' },
      { gameId: 'BODHIROOK', name: 'Bodhi Rook', type: 'CHARACTER' },
      
      // Empire units
      { gameId: 'DARTHVADER', name: 'Darth Vader', type: 'CHARACTER' },
      { gameId: 'EMPERORPALPATINE', name: 'Emperor Palpatine', type: 'CHARACTER' },
      { gameId: 'GRANDMOFFTARKIN', name: 'Grand Moff Tarkin', type: 'CHARACTER' },
      { gameId: 'ADMIRALPIETT', name: 'Admiral Piett', type: 'CHARACTER' },
      
      // Key ships for fleet battles
      { gameId: 'MILLENNIUMFALCON', name: 'Millennium Falcon', type: 'SHIP' },
      { gameId: 'XWINGREBEL', name: 'X-wing', type: 'SHIP' },
      { gameId: 'YWINGREBEL', name: 'Y-wing', type: 'SHIP' },
      { gameId: 'UWINGROGUEONE', name: 'U-wing', type: 'SHIP' },
      { gameId: 'TIEFIGHTERIMPERIAL', name: 'TIE Fighter', type: 'SHIP' },
      { gameId: 'TIEADVANCED', name: 'TIE Advanced', type: 'SHIP' }
    ];

    this.stats = {
      attempted: 0,
      downloaded: 0,
      failed: 0,
      skipped: 0,
      strategies: {}
    };
  }

  /**
   * Download image with smart retry logic
   */
  async downloadWithStrategy(strategy, gameId, outputPath) {
    const url = strategy.getUrl(gameId);
    
    for (let attempt = 1; attempt <= strategy.retries + 1; attempt++) {
      try {
        console.log(`    📡 Trying ${strategy.name}: ${url} (attempt ${attempt})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), strategy.timeout);
        
        const response = await fetch(url, {
          headers: strategy.headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Validate the image (basic check for valid image data)
        if (arrayBuffer.byteLength < 100) {
          throw new Error('Invalid image data (too small)');
        }

        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(outputPath, buffer);
        
        const stats = await fs.stat(outputPath);
        console.log(`    ✅ Downloaded via ${strategy.name}: ${stats.size} bytes`);
        
        // Update strategy stats
        this.stats.strategies[strategy.name] = (this.stats.strategies[strategy.name] || 0) + 1;
        
        return true;
      } catch (error) {
        console.log(`    ❌ ${strategy.name} attempt ${attempt} failed: ${error.message}`);
        
        if (attempt <= strategy.retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }
    
    return false;
  }

  /**
   * Download asset using all available strategies
   */
  async downloadAsset(unit) {
    const targetDir = unit.type === 'SHIP' ? this.shipsDir : this.charactersDir;
    const outputPath = path.join(targetDir, `${unit.gameId}.png`);
    
    console.log(`\n📥 Downloading ${unit.name} (${unit.gameId})...`);
    this.stats.attempted++;
    
    // Check if already exists and is valid
    try {
      const stats = await fs.stat(outputPath);
      if (stats.size > 1000) { // Reasonable minimum size
        console.log(`    ⏭️  Already exists: ${stats.size} bytes`);
        this.stats.skipped++;
        return true;
      }
    } catch {
      // File doesn't exist, proceed with download
    }

    // Try each strategy in order
    for (const strategy of this.strategies) {
      const success = await this.downloadWithStrategy(strategy, unit.gameId, outputPath);
      
      if (success) {
        this.stats.downloaded++;
        return true;
      }
      
      // Small delay between strategies
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`    ❌ All strategies failed for ${unit.gameId}`);
    this.stats.failed++;
    return false;
  }

  /**
   * Create high-quality fallback for failed downloads
   */
  async createFallbackAsset(unit) {
    const targetDir = unit.type === 'SHIP' ? this.shipsDir : this.charactersDir;
    const outputPath = path.join(targetDir, `${unit.gameId}.svg`);
    
    const isShip = unit.type === 'SHIP';
    const color = isShip ? '#FF6B6B' : '#4A90E2';
    const shape = isShip ? 
      '<polygon points="128,60 200,140 180,180 128,160 76,180 56,140" fill="url(#grad)"/>' :
      '<circle cx="128" cy="100" r="45" fill="url(#grad)"/><rect x="83" y="145" width="90" height="80" rx="45" fill="url(#grad)"/>';

    const svg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}AA;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="256" height="256" fill="#1A202C" rx="8"/>
  ${shape}
  <rect width="256" height="256" fill="none" stroke="${color}" stroke-width="2" rx="8"/>
  
  <text x="128" y="235" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${unit.name.substring(0, 12)}</text>
  <text x="128" y="250" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${unit.name.substring(12)}</text>
</svg>`.trim();

    await fs.writeFile(outputPath, svg);
    console.log(`    🎨 Created fallback SVG for ${unit.name}`);
  }

  /**
   * Update manifest with download results
   */
  async updateManifest() {
    console.log('\n📄 Updating asset manifest...');
    
    const manifest = {
      generated: new Date().toISOString(),
      version: '2.1.0',
      source: 'smart-download',
      description: 'Essential SWGoH assets for Territory Battle Tracker',
      stats: this.stats,
      strategies: this.strategies.map(s => ({
        name: s.name,
        baseUrl: s.getUrl('EXAMPLE').replace('EXAMPLE', '{gameId}'),
        successes: this.stats.strategies[s.name] || 0
      })),
      assets: {
        characters: [],
        ships: []
      }
    };

    // Scan downloaded assets
    try {
      const characterFiles = await fs.readdir(this.charactersDir);
      manifest.assets.characters = characterFiles
        .filter(file => file.endsWith('.png') || file.endsWith('.svg'))
        .map(file => ({
          gameId: path.parse(file).name,
          file: file,
          format: path.extname(file).substring(1)
        }));
    } catch (error) {
      console.log('  No character assets found');
    }

    try {
      const shipFiles = await fs.readdir(this.shipsDir);
      manifest.assets.ships = shipFiles
        .filter(file => file.endsWith('.png') || file.endsWith('.svg'))
        .map(file => ({
          gameId: path.parse(file).name,
          file: file,
          format: path.extname(file).substring(1)
        }));
    } catch (error) {
      console.log('  No ship assets found');
    }

    const manifestPath = path.join(this.assetsDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`  ✅ Manifest updated:`);
    console.log(`    📊 Characters: ${manifest.assets.characters.length}`);
    console.log(`    🚀 Ships: ${manifest.assets.ships.length}`);
    console.log(`    📈 Strategy success: ${Object.entries(this.stats.strategies).map(([k,v]) => `${k}:${v}`).join(', ')}`);
    
    return manifest;
  }

  /**
   * Run smart download process
   */
  async run() {
    console.log('🚀 Smart Asset Download Process');
    console.log('===============================');
    
    try {
      // Ensure directories exist
      await fs.mkdir(this.charactersDir, { recursive: true });
      await fs.mkdir(this.shipsDir, { recursive: true });
      
      console.log(`📋 Downloading ${this.priorityUnits.length} essential assets...`);
      
      // Download assets with rate limiting
      for (let i = 0; i < this.priorityUnits.length; i++) {
        const unit = this.priorityUnits[i];
        
        const success = await this.downloadAsset(unit);
        
        // Create fallback for failed downloads
        if (!success) {
          await this.createFallbackAsset(unit);
        }
        
        // Progress indicator
        if ((i + 1) % 5 === 0) {
          console.log(`\n📊 Progress: ${i + 1}/${this.priorityUnits.length} units processed`);
          console.log(`  ✅ Downloaded: ${this.stats.downloaded}, ❌ Failed: ${this.stats.failed}, ⏭️ Skipped: ${this.stats.skipped}`);
        }
        
        // Rate limiting between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Update manifest
      const manifest = await this.updateManifest();
      
      // Final summary
      console.log('\n🎉 Download Process Complete!');
      console.log('============================');
      console.log(`📊 Final Results:`);
      console.log(`  ✅ Successfully downloaded: ${this.stats.downloaded} assets`);
      console.log(`  ⏭️  Already existed: ${this.stats.skipped} assets`);
      console.log(`  ❌ Failed downloads: ${this.stats.failed} assets`);
      console.log(`  🎨 Fallback SVGs created: ${this.stats.failed} assets`);
      
      if (Object.keys(this.stats.strategies).length > 0) {
        console.log(`\n📈 Strategy Performance:`);
        Object.entries(this.stats.strategies).forEach(([strategy, count]) => {
          console.log(`  - ${strategy}: ${count} successful downloads`);
        });
      }
      
      const totalAssets = manifest.assets.characters.length + manifest.assets.ships.length;
      console.log(`\n📁 Total Assets Available: ${totalAssets}`);
      console.log(`  👥 Characters: ${manifest.assets.characters.length}`);
      console.log(`  🚀 Ships: ${manifest.assets.ships.length}`);
      
      console.log('\n🎯 Your TB tracker now has essential assets for development!');
      
    } catch (error) {
      console.error('\n❌ Download process failed:', error);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const downloader = new SmartAssetDownloader();
  downloader.run().catch(console.error);
}

module.exports = SmartAssetDownloader;