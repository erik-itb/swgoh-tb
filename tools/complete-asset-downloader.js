#!/usr/bin/env node

/**
 * Complete Asset Downloader
 * Downloads ALL unit portraits from units.json using actual PNG images from swgoh.gg
 * NO PLACEHOLDERS - Real images only!
 */

const fs = require('fs').promises;
const path = require('path');

class CompleteAssetDownloader {
  constructor() {
    this.assetsDir = path.resolve(__dirname, '../assets');
    this.charactersDir = path.resolve(this.assetsDir, 'characters');
    this.shipsDir = path.resolve(this.assetsDir, 'ships');
    this.unitsJsonPath = path.resolve(__dirname, '../data/gamedata/units.json');

    this.stats = {
      total: 0,
      downloaded: 0,
      skipped: 0,
      failed: 0,
      characters: 0,
      ships: 0,
      errors: []
    };
  }

  /**
   * Load all units from units.json
   */
  async loadUnits() {
    console.log('📖 Loading units from gamedata...');

    try {
      const rawData = await fs.readFile(this.unitsJsonPath, 'utf8');
      const gameData = JSON.parse(rawData);

      if (!gameData.data || !Array.isArray(gameData.data)) {
        throw new Error('Invalid units.json format - expected {data: [...]}');
      }

      // Extract unique base units (avoid duplicates from different star levels)
      const unitsMap = new Map();

      for (const unit of gameData.data) {
        const baseId = unit.baseId;
        const combatType = unit.combatType; // 1 = CHARACTER, 2 = SHIP

        // Skip if we already have this base unit
        if (unitsMap.has(baseId)) {
          continue;
        }

        // Determine type
        const type = combatType === 2 ? 'SHIP' : 'CHARACTER';

        unitsMap.set(baseId, {
          gameId: baseId,
          name: unit.nameKey || baseId,
          type: type,
          thumbnailName: unit.thumbnailName || `tex.charui_${baseId.toLowerCase()}`
        });
      }

      const units = Array.from(unitsMap.values());
      console.log(`  ✅ Loaded ${units.length} unique units`);
      console.log(`  👥 Characters: ${units.filter(u => u.type === 'CHARACTER').length}`);
      console.log(`  🚀 Ships: ${units.filter(u => u.type === 'SHIP').length}`);

      return units;
    } catch (error) {
      console.error(`  ❌ Failed to load units.json:`, error.message);
      throw error;
    }
  }

  /**
   * Download actual PNG image from swgoh.gg
   */
  async downloadImage(url, outputPath, gameId, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/png,image/*;q=0.9,*/*;q=0.8'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Validate it's actually an image (PNG starts with 89 50 4E 47)
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length < 1000) {
          throw new Error('File too small - likely not a real image');
        }

        // Check PNG signature
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        if (!isPNG) {
          throw new Error('Not a valid PNG file');
        }

        await fs.writeFile(outputPath, buffer);

        const stats = await fs.stat(outputPath);
        return { success: true, size: stats.size };

      } catch (error) {
        if (attempt === retries) {
          return { success: false, error: error.message };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Download asset for a unit
   */
  async downloadAsset(unit) {
    const targetDir = unit.type === 'SHIP' ? this.shipsDir : this.charactersDir;
    const outputPath = path.join(targetDir, `${unit.gameId}.png`);

    this.stats.total++;

    // Check if already exists and is valid
    try {
      const stats = await fs.stat(outputPath);
      const buffer = await fs.readFile(outputPath);

      // Verify it's a real PNG
      const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

      if (stats.size > 1000 && isPNG) {
        this.stats.skipped++;
        return { success: true, skipped: true, size: stats.size };
      }
    } catch {
      // File doesn't exist or is invalid, proceed with download
    }

    // Try swgoh.gg with different URL patterns
    const urls = [
      // Primary: Direct character UI texture
      `https://swgoh.gg/static/img/assets/tex.charui_${unit.gameId.toLowerCase()}.png`,

      // Fallback 1: Ship texture
      `https://swgoh.gg/static/img/assets/tex.ship_${unit.gameId.toLowerCase()}.png`,

      // Fallback 2: Generic asset path
      `https://swgoh.gg/static/img/assets/${unit.gameId.toLowerCase()}.png`,

      // Fallback 3: Character portrait
      `https://swgoh.gg/static/img/assets/char/${unit.gameId}.png`
    ];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const result = await this.downloadImage(url, outputPath, unit.gameId);

      if (result.success) {
        this.stats.downloaded++;
        if (unit.type === 'SHIP') {
          this.stats.ships++;
        } else {
          this.stats.characters++;
        }
        return { success: true, url, size: result.size };
      }
    }

    // All URLs failed
    this.stats.failed++;
    this.stats.errors.push(unit.gameId);
    return { success: false, gameId: unit.gameId };
  }

  /**
   * Process units in batches
   */
  async processBatch(units, batchSize = 10) {
    console.log(`\n📥 Downloading ${units.length} assets in batches of ${batchSize}...`);

    for (let i = 0; i < units.length; i += batchSize) {
      const batch = units.slice(i, Math.min(i + batchSize, units.length));

      // Process batch concurrently
      const results = await Promise.all(
        batch.map(async (unit) => {
          const result = await this.downloadAsset(unit);
          return { unit, result };
        })
      );

      // Log progress
      for (const { unit, result } of results) {
        if (result.skipped) {
          console.log(`  ⏭️  ${unit.gameId} (${unit.type}) - Already exists (${result.size} bytes)`);
        } else if (result.success) {
          console.log(`  ✅ ${unit.gameId} (${unit.type}) - Downloaded (${result.size} bytes)`);
        } else {
          console.log(`  ❌ ${unit.gameId} (${unit.type}) - Failed`);
        }
      }

      // Progress report every batch
      const progress = Math.min(i + batchSize, units.length);
      console.log(`\n📊 Progress: ${progress}/${units.length} | ✅ ${this.stats.downloaded} | ⏭️ ${this.stats.skipped} | ❌ ${this.stats.failed}\n`);

      // Rate limiting between batches
      if (i + batchSize < units.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Generate manifest with download results
   */
  async generateManifest() {
    console.log('\n📄 Generating asset manifest...');

    const manifest = {
      generated: new Date().toISOString(),
      version: '3.0.0',
      source: 'swgoh.gg-complete-download',
      description: 'Complete SWGoH unit portraits downloaded from swgoh.gg',
      stats: {
        totalUnits: this.stats.total,
        downloaded: this.stats.downloaded,
        skipped: this.stats.skipped,
        failed: this.stats.failed,
        characters: this.stats.characters,
        ships: this.stats.ships
      },
      assets: {
        characters: [],
        ships: []
      }
    };

    // Scan downloaded assets
    try {
      const characterFiles = await fs.readdir(this.charactersDir);
      for (const file of characterFiles) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.charactersDir, file);
          const stats = await fs.stat(filePath);
          manifest.assets.characters.push({
            gameId: path.parse(file).name,
            file: file,
            size: stats.size
          });
        }
      }
    } catch (error) {
      console.log('  No character assets found');
    }

    try {
      const shipFiles = await fs.readdir(this.shipsDir);
      for (const file of shipFiles) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.shipsDir, file);
          const stats = await fs.stat(filePath);
          manifest.assets.ships.push({
            gameId: path.parse(file).name,
            file: file,
            size: stats.size
          });
        }
      }
    } catch (error) {
      console.log('  No ship assets found');
    }

    const manifestPath = path.join(this.assetsDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`  ✅ Manifest created:`);
    console.log(`    📊 Total Assets: ${manifest.assets.characters.length + manifest.assets.ships.length}`);
    console.log(`    👥 Characters: ${manifest.assets.characters.length}`);
    console.log(`    🚀 Ships: ${manifest.assets.ships.length}`);

    return manifest;
  }

  /**
   * Run complete download process
   */
  async run() {
    console.log('🎯 Complete Asset Download Process');
    console.log('==================================');
    console.log('📌 Source: units.json from gamedata');
    console.log('🎨 Format: Real PNG images from swgoh.gg');
    console.log('🚫 No placeholders or SVGs\n');

    try {
      // Create directories
      await fs.mkdir(this.charactersDir, { recursive: true });
      await fs.mkdir(this.shipsDir, { recursive: true });

      // Load all units from units.json
      const units = await this.loadUnits();

      // Download all assets
      await this.processBatch(units, 10);

      // Generate manifest
      const manifest = await this.generateManifest();

      // Final summary
      console.log('\n🎉 Download Complete!');
      console.log('=====================');
      console.log(`📊 Results:`);
      console.log(`  ✅ Downloaded: ${this.stats.downloaded} new assets`);
      console.log(`  ⏭️  Skipped: ${this.stats.skipped} existing assets`);
      console.log(`  ❌ Failed: ${this.stats.failed} assets`);
      console.log(`\n📁 Total Available:`);
      console.log(`  👥 Characters: ${manifest.assets.characters.length} PNG files`);
      console.log(`  🚀 Ships: ${manifest.assets.ships.length} PNG files`);
      console.log(`  📦 Total: ${manifest.assets.characters.length + manifest.assets.ships.length} assets`);

      if (this.stats.errors.length > 0) {
        console.log(`\n⚠️  Failed Units (${this.stats.errors.length}):`);
        console.log(`  ${this.stats.errors.slice(0, 20).join(', ')}`);
        if (this.stats.errors.length > 20) {
          console.log(`  ... and ${this.stats.errors.length - 20} more`);
        }
      }

      const successRate = ((this.stats.downloaded + this.stats.skipped) / this.stats.total * 100).toFixed(1);
      console.log(`\n✨ Success Rate: ${successRate}%`);
      console.log(`📁 Assets Location: ${path.relative(process.cwd(), this.assetsDir)}`);

    } catch (error) {
      console.error('\n❌ Download process failed:', error);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const downloader = new CompleteAssetDownloader();
  downloader.run().catch(console.error);
}

module.exports = CompleteAssetDownloader;