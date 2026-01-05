#!/usr/bin/env node

/**
 * Complete Portrait Downloader - Uses SWGoH.gg API
 * Downloads ALL unit portraits from swgoh.gg API using real PNG images
 *
 * Data Source: swgoh.gg API (/api/units/)
 * Image Source: game-assets.swgoh.gg (from API response)
 */

const fs = require('fs').promises;
const path = require('path');

class PortraitDownloader {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiBaseUrl = 'https://swgoh.gg/api/units/';
    this.assetsDir = path.resolve(__dirname, '../assets');
    this.charactersDir = path.resolve(this.assetsDir, 'characters');
    this.shipsDir = path.resolve(this.assetsDir, 'ships');

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
   * Fetch all units from swgoh.gg API
   */
  async fetchAllUnits() {
    console.log('📖 Fetching units from swgoh.gg API...');

    let allUnits = [];
    let nextUrl = this.apiBaseUrl;

    while (nextUrl) {
      try {
        const response = await fetch(nextUrl, {
          headers: {
            'x-gg-bot-access': this.apiKey,
            'Accept': 'application/json',
            'User-Agent': 'SWGoH-TB-Tracker/2.0'
          }
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        allUnits = allUnits.concat(data.data || []);

        // Check for next page
        nextUrl = data.next;

        console.log(`  📄 Loaded ${allUnits.length} units so far...`);

        // Rate limiting
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`  ❌ API Error:`, error.message);
        throw error;
      }
    }

    console.log(`  ✅ Loaded ${allUnits.length} total units`);

    // Count by type
    const characters = allUnits.filter(u => u.combat_type === 1).length;
    const ships = allUnits.filter(u => u.combat_type === 2).length;
    console.log(`  👥 Characters: ${characters}`);
    console.log(`  🚀 Ships: ${ships}`);

    return allUnits;
  }

  /**
   * Download image from URL
   */
  async downloadImage(url, outputPath, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate it's a real PNG (not HTML error page)
        if (buffer.length < 100) {
          throw new Error('File too small');
        }

        // Check PNG signature
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        if (!isPNG) {
          throw new Error('Not a PNG file');
        }

        await fs.writeFile(outputPath, buffer);
        const stats = await fs.stat(outputPath);
        return { success: true, size: stats.size };

      } catch (error) {
        if (attempt === retries) {
          return { success: false, error: error.message };
        }
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Download portrait for a unit
   */
  async downloadPortrait(unit) {
    const isShip = unit.combat_type === 2;
    const targetDir = isShip ? this.shipsDir : this.charactersDir;
    const outputPath = path.join(targetDir, `${unit.base_id}.png`);

    this.stats.total++;

    // Check if already exists
    try {
      const stats = await fs.stat(outputPath);
      const buffer = await fs.readFile(outputPath);
      const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50;

      if (stats.size > 1000 && isPNG) {
        this.stats.skipped++;
        return { success: true, skipped: true };
      }
    } catch {
      // File doesn't exist, proceed
    }

    // Download from API-provided URL
    const imageUrl = unit.image;

    if (!imageUrl) {
      this.stats.failed++;
      this.stats.errors.push(`${unit.base_id} - No image URL`);
      return { success: false, error: 'No image URL' };
    }

    // Ensure URL is absolute
    const absoluteUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;

    const result = await this.downloadImage(absoluteUrl, outputPath);

    if (result.success) {
      this.stats.downloaded++;
      if (isShip) {
        this.stats.ships++;
      } else {
        this.stats.characters++;
      }
      return { success: true, size: result.size };
    }

    this.stats.failed++;
    this.stats.errors.push(`${unit.base_id} - ${result.error}`);
    return { success: false, error: result.error };
  }

  /**
   * Process units in batches
   */
  async processBatch(units, batchSize = 5) {
    console.log(`\n📥 Downloading ${units.length} portraits in batches of ${batchSize}...`);

    for (let i = 0; i < units.length; i += batchSize) {
      const batch = units.slice(i, Math.min(i + batchSize, units.length));

      const results = await Promise.all(
        batch.map(async (unit) => {
          const result = await this.downloadPortrait(unit);
          return { unit, result };
        })
      );

      // Log results
      for (const { unit, result } of results) {
        const type = unit.combat_type === 2 ? 'SHIP' : 'CHAR';
        if (result.skipped) {
          console.log(`  ⏭️  ${unit.base_id} (${type}) - Exists`);
        } else if (result.success) {
          console.log(`  ✅ ${unit.base_id} (${type}) - ${result.size} bytes`);
        } else {
          console.log(`  ❌ ${unit.base_id} (${type}) - ${result.error}`);
        }
      }

      const progress = Math.min(i + batchSize, units.length);
      console.log(`\n📊 Progress: ${progress}/${units.length} | ✅ ${this.stats.downloaded} | ⏭️ ${this.stats.skipped} | ❌ ${this.stats.failed}\n`);

      // Rate limiting between batches
      if (i + batchSize < units.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Generate manifest
   */
  async generateManifest() {
    console.log('\n📄 Generating manifest...');

    const manifest = {
      generated: new Date().toISOString(),
      version: '4.0.0',
      source: 'swgoh.gg-api',
      description: 'Complete SWGoH unit portraits from swgoh.gg API',
      stats: this.stats,
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
            baseId: path.parse(file).name,
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
            baseId: path.parse(file).name,
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
    console.log(`    👥 Characters: ${manifest.assets.characters.length}`);
    console.log(`    🚀 Ships: ${manifest.assets.ships.length}`);
    console.log(`    📦 Total: ${manifest.assets.characters.length + manifest.assets.ships.length}`);

    return manifest;
  }

  /**
   * Run download process
   */
  async run() {
    console.log('🎯 SWGoH Portrait Downloader');
    console.log('============================');
    console.log('📌 Source: swgoh.gg API');
    console.log('🎨 Format: Real PNG images (128x128)');
    console.log('🔑 Using API authentication\n');

    try {
      // Create directories
      await fs.mkdir(this.charactersDir, { recursive: true });
      await fs.mkdir(this.shipsDir, { recursive: true });

      // Fetch all units from API
      const units = await this.fetchAllUnits();

      // Download all portraits
      await this.processBatch(units, 5);

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

      if (this.stats.errors.length > 0 && this.stats.errors.length <= 20) {
        console.log(`\n⚠️  Failed Downloads:`);
        this.stats.errors.forEach(err => console.log(`  - ${err}`));
      } else if (this.stats.errors.length > 20) {
        console.log(`\n⚠️  ${this.stats.errors.length} downloads failed (see logs above)`);
      }

      const successRate = ((this.stats.downloaded + this.stats.skipped) / this.stats.total * 100).toFixed(1);
      console.log(`\n✨ Success Rate: ${successRate}%`);
      console.log(`📁 Location: ${path.relative(process.cwd(), this.assetsDir)}`);

    } catch (error) {
      console.error('\n❌ Process failed:', error);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  // Get API key from environment or command line
  const apiKey = process.env.SWGOH_GG_API_KEY || process.argv[2];

  if (!apiKey) {
    console.error('❌ Error: SWGOH_GG_API_KEY environment variable or API key argument required');
    console.error('Usage: node download-all-portraits.js [API_KEY]');
    console.error('   or: SWGOH_GG_API_KEY=your_key node download-all-portraits.js');
    process.exit(1);
  }

  const downloader = new PortraitDownloader(apiKey);
  downloader.run().catch(console.error);
}

module.exports = PortraitDownloader;