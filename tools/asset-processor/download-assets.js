#!/usr/bin/env node
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const assetsDir = path.join(projectRoot, 'assets');
const dataDir = path.join(projectRoot, 'data');

// Configuration
const AE2_API_URL = 'http://localhost:3001';
const BATCH_SIZE = 5; // Number of concurrent downloads
const DELAY_BETWEEN_BATCHES = 1000; // ms

// Asset types we want to download
const ASSET_TYPES = {
  character_portraits: {
    prefix: 'charui_',
    outputDir: path.join(assetsDir, 'units/portraits'),
    sizes: { sm: 128, md: 256, lg: 512 }
  },
  character_icons: {
    prefix: 'char_',
    outputDir: path.join(assetsDir, 'units/icons'),
    sizes: { sm: 64, md: 128, lg: 256 }
  },
  planet_backgrounds: {
    prefix: 'planet_',
    outputDir: path.join(assetsDir, 'planets/backgrounds'),
    sizes: { sm: 512, md: 1024, lg: 2048 }
  }
};

class AssetDownloader {
  constructor() {
    this.downloadedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;
  }

  async ensureDirectories() {
    console.log(chalk.blue('📁 Creating asset directories...'));

    for (const assetType of Object.values(ASSET_TYPES)) {
      await fs.ensureDir(assetType.outputDir);
      console.log(chalk.green(`✓ Created ${assetType.outputDir}`));
    }
  }

  async checkAE2Connection() {
    try {
      console.log(chalk.blue('🔌 Checking swgoh-ae2 connection...'));
      const response = await axios.get(`${AE2_API_URL}/swagger/v1/swagger.json`, {
        timeout: 5000
      });
      console.log(chalk.green('✓ swgoh-ae2 API is accessible'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Cannot connect to swgoh-ae2 API'));
      console.error(chalk.red('   Make sure the container is running: ./scripts/start-asset-extractor.sh'));
      return false;
    }
  }

  async getAssetList() {
    try {
      console.log(chalk.blue('📋 Fetching asset list from swgoh-ae2...'));

      // This endpoint might not exist, we'll need to check the swagger docs
      // For now, let's try to get available prefixes or asset names
      const response = await axios.get(`${AE2_API_URL}/AssetNames`, {
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not fetch asset list from API'));
      console.warn(chalk.yellow('   Will use predefined asset lists instead'));
      return null;
    }
  }

  async downloadAsset(assetName, outputPath) {
    try {
      const url = `${AE2_API_URL}/Asset/single`;
      const params = {
        assetName: assetName,
        forceReDownload: false
      };

      const response = await axios.get(url, {
        params,
        responseType: 'arraybuffer',
        timeout: 30000
      });

      await fs.writeFile(outputPath, response.data);
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to download ${assetName}: ${error.message}`));
      return false;
    }
  }

  async downloadAssetBatch(assets, assetType) {
    const promises = assets.map(async (assetName) => {
      const sanitizedName = assetName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const outputPath = path.join(assetType.outputDir, `${sanitizedName}.png`);

      // Skip if file already exists
      if (await fs.pathExists(outputPath)) {
        this.skippedCount++;
        return { success: true, skipped: true };
      }

      const success = await this.downloadAsset(assetName, outputPath);
      if (success) {
        this.downloadedCount++;
        console.log(chalk.green(`✓ Downloaded ${assetName}`));
      } else {
        this.failedCount++;
      }

      return { success, skipped: false };
    });

    await Promise.all(promises);
  }

  async downloadCharacterPortraits() {
    console.log(chalk.blue('👥 Downloading character portraits...'));

    // Load units data to get character list
    const unitsPath = path.join(dataDir, 'gamedata/units.json');
    if (!await fs.pathExists(unitsPath)) {
      console.error(chalk.red('❌ Units data not found. Run gamedata download first.'));
      return;
    }

    const unitsData = JSON.parse(await fs.readFile(unitsPath, 'utf-8'));

    // Extract character IDs for portrait downloads
    const characterIds = unitsData.data
      .filter(unit => unit.combatType === 1) // Characters only, not ships
      .map(unit => unit.baseId)
      .slice(0, 20); // Limit to first 20 for testing

    console.log(chalk.blue(`📊 Found ${characterIds.length} characters to download`));

    // Create asset names for portraits
    const portraitAssets = characterIds.map(id => `charui_${id.toLowerCase()}`);

    // Download in batches
    for (let i = 0; i < portraitAssets.length; i += BATCH_SIZE) {
      const batch = portraitAssets.slice(i, i + BATCH_SIZE);
      console.log(chalk.blue(`⏬ Downloading batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(portraitAssets.length/BATCH_SIZE)}`));

      await this.downloadAssetBatch(batch, ASSET_TYPES.character_portraits);

      if (i + BATCH_SIZE < portraitAssets.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
  }

  async generateManifest() {
    console.log(chalk.blue('📝 Generating asset manifest...'));

    const manifest = {
      generated: new Date().toISOString(),
      assets: {}
    };

    for (const [typeName, typeConfig] of Object.entries(ASSET_TYPES)) {
      const files = await fs.readdir(typeConfig.outputDir).catch(() => []);
      manifest.assets[typeName] = files
        .filter(file => file.endsWith('.png'))
        .map(file => ({
          filename: file,
          path: path.relative(projectRoot, path.join(typeConfig.outputDir, file)),
          gameId: file.replace('.png', '').replace(/^(charui_|char_|planet_)/, '')
        }));
    }

    const manifestPath = path.join(assetsDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(chalk.green(`✓ Manifest saved to ${manifestPath}`));
  }

  async run() {
    console.log(chalk.bold.blue('🚀 SWGoH Asset Downloader'));
    console.log(chalk.blue('================================'));

    await this.ensureDirectories();

    if (!await this.checkAE2Connection()) {
      process.exit(1);
    }

    // Start with character portraits
    await this.downloadCharacterPortraits();

    await this.generateManifest();

    console.log(chalk.bold.green('\n📊 Download Summary:'));
    console.log(chalk.green(`✓ Downloaded: ${this.downloadedCount}`));
    console.log(chalk.yellow(`⏭️  Skipped: ${this.skippedCount}`));
    console.log(chalk.red(`❌ Failed: ${this.failedCount}`));

    if (this.failedCount > 0) {
      console.log(chalk.yellow('\n⚠️  Some downloads failed. This is normal for missing assets.'));
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const downloader = new AssetDownloader();
  downloader.run().catch(error => {
    console.error(chalk.red('💥 Fatal error:'), error);
    process.exit(1);
  });
}

export default AssetDownloader;