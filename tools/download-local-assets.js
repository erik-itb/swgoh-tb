#!/usr/bin/env node

/**
 * Local Asset Download Script
 * Downloads essential character and ship portraits for local fallback use
 */

const fs = require('fs').promises;
const path = require('path');

class LocalAssetDownloader {
  constructor() {
    this.assetsDir = path.resolve(__dirname, '../assets');
    this.fallbackDir = path.resolve(this.assetsDir, 'fallback');
    this.charactersDir = path.resolve(this.assetsDir, 'characters');
    this.shipsDir = path.resolve(this.assetsDir, 'ships');
    
    // Try multiple sources for maximum coverage
    this.sources = [
      {
        name: 'swgoh.help',
        baseUrl: 'https://api.swgoh.help/image/char',
        format: 'char/{gameId}',
        priority: 1
      },
      {
        name: 'swgoh.gg-game-assets',
        baseUrl: 'https://game-assets.swgoh.gg',
        format: 'tex.charui_{gameId}.png',
        priority: 2
      },
      {
        name: 'swgoh.gg-static',
        baseUrl: 'https://swgoh.gg/static/img/assets',
        format: 'tex.charui_{gameId}.png',
        priority: 3
      }
    ];

    // Essential units for TB tracker (focusing on key characters for Rise of the Empire)
    this.essentialUnits = [
      // Core Rebels
      'COMMANDERLUKESKYWALKER',
      'PRINCESSLEIA',
      'HANSOLO',
      'CHEWBACCA',
      'R2D2',
      'C3PO',
      
      // Rogue One
      'JYNERSO',
      'CASSIANANDOR',
      'K2SO',
      'CHIRRUT',
      'BAZE',
      'BODHIROOK',
      
      // Empire
      'DARTHVADER',
      'EMPERORPALPATINE',
      'GRANDMOFFTARKIN',
      'ADMIRALPIETT',
      'COLONELSTARCK',
      'MAGMATROOPER',
      'DEATHTROOPER',
      'IMPERIALPROBEDROID',
      
      // Ships
      'MILLENNIUMFALCON',
      'YWINGREBEL',
      'XWINGREBEL',
      'UWINGROGUEONE',
      'TIEFIGHTERIMPERIAL',
      'TIEADVANCED',
      'LAMBDA',
      'CAPITALSTARDESTROYERI',
      
      // Bad Batch (common TB units)
      'BADBATCHHUNTER',
      'BADBATCHTECH',
      'BADBATCHECHO',
      'BADBATCHWRECKER',
      'BADBATCHOMEGA',
      
      // Common meta characters
      'JEDIKNIGHTREVAN',
      'DARTHREVAN',
      'GRANDMASTERLUKE',
      'JEDIMASTERTLUKE',
      'BB8',
      'REYJEDITRAINING'
    ];
  }

  /**
   * Create directory structure
   */
  async createDirectories() {
    console.log('📁 Creating asset directory structure...');
    
    const dirs = [
      this.assetsDir,
      this.fallbackDir,
      this.charactersDir,
      this.shipsDir
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`  ✅ Created: ${path.relative(process.cwd(), dir)}`);
      } catch (error) {
        console.error(`  ❌ Failed to create ${dir}:`, error.message);
      }
    }
  }

  /**
   * Download image from URL with multiple attempts
   */
  async downloadImage(url, outputPath, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`    Downloading: ${url} (attempt ${attempt}/${retries})`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'SWGoH-TB-Tracker/1.0'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        await fs.writeFile(outputPath, buffer);
        
        const stats = await fs.stat(outputPath);
        console.log(`    ✅ Downloaded: ${path.basename(outputPath)} (${stats.size} bytes)`);
        
        return true;
      } catch (error) {
        console.log(`    ❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === retries) {
          return false;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return false;
  }

  /**
   * Try downloading from multiple sources
   */
  async downloadFromSources(gameId, outputPath) {
    const isShip = this.isShipGameId(gameId);
    
    for (const source of this.sources) {
      let url;
      
      if (source.name === 'swgoh.help') {
        url = `${source.baseUrl}/${gameId}`;
      } else {
        // Convert to lowercase for swgoh.gg sources
        const formattedId = gameId.toLowerCase();
        url = `${source.baseUrl}/${source.format.replace('{gameId}', formattedId)}`;
      }
      
      console.log(`  🔍 Trying ${source.name} source...`);
      const success = await this.downloadImage(url, outputPath);
      
      if (success) {
        console.log(`    ✅ Success with ${source.name}`);
        return true;
      }
      
      // Small delay between source attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return false;
  }

  /**
   * Detect if gameId is a ship
   */
  isShipGameId(gameId) {
    const shipPatterns = [
      /SHIP/i, /FALCON/i, /WING/i, /TIE/i, /LAMBDA/i, /PHANTOM/i, 
      /GHOST/i, /SLAVE/i, /SCYTHE/i, /BOMBER/i, /FIGHTER/i,
      /FRIGATE/i, /DESTROYER/i, /CRUISER/i, /CAPITAL/i
    ];
    return shipPatterns.some(pattern => pattern.test(gameId));
  }

  /**
   * Download all essential assets
   */
  async downloadEssentialAssets() {
    console.log('🚀 Downloading essential assets...');
    
    const results = {
      downloaded: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const gameId of this.essentialUnits) {
      const isShip = this.isShipGameId(gameId);
      const targetDir = isShip ? this.shipsDir : this.charactersDir;
      const outputPath = path.join(targetDir, `${gameId}.png`);
      
      console.log(`\n📥 Processing ${gameId} (${isShip ? 'ship' : 'character'})...`);
      
      // Check if already exists
      try {
        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          console.log(`    ⏭️  Already exists: ${path.basename(outputPath)} (${stats.size} bytes)`);
          results.skipped++;
          continue;
        }
      } catch {
        // File doesn't exist, proceed with download
      }

      const success = await this.downloadFromSources(gameId, outputPath);
      
      if (success) {
        results.downloaded++;
      } else {
        results.failed++;
        results.errors.push(`Failed to download ${gameId}`);
        console.log(`    ❌ All sources failed for ${gameId}`);
      }
      
      // Rate limiting between downloads
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  /**
   * Create fallback images (simple colored placeholders)
   */
  async createFallbackImages() {
    console.log('\n🎨 Creating fallback placeholder images...');
    
    // Create simple SVG placeholders that can be converted or used directly
    const characterSvg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#2D3748"/>
  <circle cx="128" cy="128" r="64" fill="#4A5568"/>
  <text x="128" y="200" text-anchor="middle" fill="#E2E8F0" font-family="Arial" font-size="16">Character</text>
</svg>`.trim();

    const shipSvg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#1A202C"/>
  <polygon points="128,64 192,192 64,192" fill="#2D3748"/>
  <text x="128" y="220" text-anchor="middle" fill="#E2E8F0" font-family="Arial" font-size="16">Ship</text>
</svg>`.trim();

    const fallbacks = [
      { name: 'character-portrait.svg', content: characterSvg },
      { name: 'character-icon.svg', content: characterSvg },
      { name: 'ship-portrait.svg', content: shipSvg },
      { name: 'ship-icon.svg', content: shipSvg }
    ];

    for (const fallback of fallbacks) {
      const fallbackPath = path.join(this.fallbackDir, fallback.name);
      await fs.writeFile(fallbackPath, fallback.content);
      console.log(`  ✅ Created: ${fallback.name}`);
    }
  }

  /**
   * Generate asset manifest
   */
  async generateManifest() {
    console.log('\n📄 Generating asset manifest...');
    
    const manifest = {
      generated: new Date().toISOString(),
      version: '1.0.0',
      source: 'local-download',
      assets: {
        characters: [],
        ships: [],
        fallbacks: ['character-portrait.svg', 'character-icon.svg', 'ship-portrait.svg', 'ship-icon.svg']
      }
    };

    // Scan downloaded assets
    try {
      const characterFiles = await fs.readdir(this.charactersDir);
      manifest.assets.characters = characterFiles
        .filter(file => file.endsWith('.png'))
        .map(file => path.parse(file).name);
    } catch (error) {
      console.log('  No character assets found');
    }

    try {
      const shipFiles = await fs.readdir(this.shipsDir);
      manifest.assets.ships = shipFiles
        .filter(file => file.endsWith('.png'))
        .map(file => path.parse(file).name);
    } catch (error) {
      console.log('  No ship assets found');
    }

    const manifestPath = path.join(this.assetsDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`  ✅ Created manifest: ${manifest.assets.characters.length} characters, ${manifest.assets.ships.length} ships`);
    
    return manifest;
  }

  /**
   * Run complete asset download process
   */
  async run() {
    console.log('🎯 Starting Local Asset Download Process');
    console.log('=====================================');
    
    try {
      // Setup
      await this.createDirectories();
      
      // Download assets
      const results = await this.downloadEssentialAssets();
      
      // Create fallbacks
      await this.createFallbackImages();
      
      // Generate manifest
      const manifest = await this.generateManifest();
      
      // Summary
      console.log('\n📊 Download Summary:');
      console.log(`  ✅ Downloaded: ${results.downloaded} assets`);
      console.log(`  ⏭️  Skipped: ${results.skipped} existing assets`);
      console.log(`  ❌ Failed: ${results.failed} assets`);
      console.log(`  📁 Total characters: ${manifest.assets.characters.length}`);
      console.log(`  🚀 Total ships: ${manifest.assets.ships.length}`);
      console.log(`  🎨 Fallback images: ${manifest.assets.fallbacks.length}`);
      
      if (results.errors.length > 0) {
        console.log('\n⚠️  Failed downloads:');
        results.errors.forEach(error => console.log(`    - ${error}`));
      }
      
      console.log('\n🎉 Local asset setup complete!');
      console.log(`📁 Assets stored in: ${path.relative(process.cwd(), this.assetsDir)}`);
      
    } catch (error) {
      console.error('\n❌ Asset download process failed:', error);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const downloader = new LocalAssetDownloader();
  downloader.run().catch(console.error);
}

module.exports = LocalAssetDownloader;