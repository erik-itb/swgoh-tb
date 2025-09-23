#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const assetsDir = path.join(projectRoot, 'assets');

// Image processing configuration
const SIZES = {
  portraits: { sm: 64, md: 128, lg: 256 },
  icons: { sm: 32, md: 48, lg: 64 },
  planets: { sm: 256, md: 512, lg: 1024 }
};

const QUALITY = {
  webp: 85,
  jpeg: 80
};

class AssetProcessor {
  constructor() {
    this.processedCount = 0;
    this.failedCount = 0;
  }

  async optimizeImage(inputPath, outputPath, options = {}) {
    const { width = 512, quality = 85, format = 'webp' } = options;

    try {
      await sharp(inputPath)
        .resize(width, width, {
          fit: 'cover',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toFile(outputPath);

      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to process ${inputPath}: ${error.message}`));
      return false;
    }
  }

  async processAssetDirectory(sourceDir, targetDir, sizes, assetType) {
    if (!await fs.pathExists(sourceDir)) {
      console.warn(chalk.yellow(`⚠️  Source directory not found: ${sourceDir}`));
      return;
    }

    console.log(chalk.blue(`🖼️  Processing ${assetType} assets...`));

    const files = await fs.readdir(sourceDir);
    const imageFiles = files.filter(file =>
      file.toLowerCase().endsWith('.png') ||
      file.toLowerCase().endsWith('.jpg') ||
      file.toLowerCase().endsWith('.jpeg')
    );

    console.log(chalk.blue(`📊 Found ${imageFiles.length} ${assetType} images to process`));

    for (const file of imageFiles) {
      const inputPath = path.join(sourceDir, file);
      const baseName = path.parse(file).name;

      // Create different sizes
      for (const [sizeName, width] of Object.entries(sizes)) {
        const outputDir = path.join(targetDir, sizeName);
        await fs.ensureDir(outputDir);

        const outputPath = path.join(outputDir, `${baseName}.webp`);

        // Skip if already processed
        if (await fs.pathExists(outputPath)) {
          continue;
        }

        const success = await this.optimizeImage(inputPath, outputPath, {
          width,
          quality: QUALITY.webp,
          format: 'webp'
        });

        if (success) {
          this.processedCount++;
          console.log(chalk.green(`✓ Processed ${baseName} (${sizeName}: ${width}px)`));
        } else {
          this.failedCount++;
        }
      }
    }
  }

  async processUnitPortraits() {
    const sourceDir = path.join(assetsDir, 'units/portraits');
    const targetDir = path.join(assetsDir, 'units/portraits');

    await this.processAssetDirectory(sourceDir, targetDir, SIZES.portraits, 'unit portraits');
  }

  async processUnitIcons() {
    const sourceDir = path.join(assetsDir, 'units/icons');
    const targetDir = path.join(assetsDir, 'units/icons');

    await this.processAssetDirectory(sourceDir, targetDir, SIZES.icons, 'unit icons');
  }

  async processPlanetBackgrounds() {
    const sourceDir = path.join(assetsDir, 'planets/backgrounds');
    const targetDir = path.join(assetsDir, 'planets/backgrounds');

    await this.processAssetDirectory(sourceDir, targetDir, SIZES.planets, 'planet backgrounds');
  }

  async generateOptimizedManifest() {
    console.log(chalk.blue('📝 Generating optimized asset manifest...'));

    const manifest = {
      generated: new Date().toISOString(),
      optimized: true,
      formats: ['webp'],
      sizes: SIZES,
      assets: {}
    };

    const assetTypes = [
      { name: 'unit_portraits', dir: 'units/portraits' },
      { name: 'unit_icons', dir: 'units/icons' },
      { name: 'planet_backgrounds', dir: 'planets/backgrounds' }
    ];

    for (const assetType of assetTypes) {
      manifest.assets[assetType.name] = {};

      for (const sizeName of Object.keys(SIZES.portraits)) {
        const sizeDir = path.join(assetsDir, assetType.dir, sizeName);

        if (await fs.pathExists(sizeDir)) {
          const files = await fs.readdir(sizeDir);
          const webpFiles = files.filter(file => file.endsWith('.webp'));

          manifest.assets[assetType.name][sizeName] = webpFiles.map(file => ({
            filename: file,
            path: path.relative(projectRoot, path.join(sizeDir, file)),
            gameId: file.replace('.webp', '').replace(/^(charui_|char_|planet_)/, ''),
            url: `/assets/${assetType.dir}/${sizeName}/${file}`
          }));
        }
      }
    }

    const manifestPath = path.join(assetsDir, 'manifest-optimized.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(chalk.green(`✓ Optimized manifest saved to ${manifestPath}`));

    return manifest;
  }

  async cleanupOriginals() {
    console.log(chalk.blue('🧹 Cleaning up original PNG files...'));

    const directories = [
      path.join(assetsDir, 'units/portraits'),
      path.join(assetsDir, 'units/icons'),
      path.join(assetsDir, 'planets/backgrounds')
    ];

    let cleanedCount = 0;

    for (const dir of directories) {
      if (!await fs.pathExists(dir)) continue;

      const files = await fs.readdir(dir);
      const pngFiles = files.filter(file =>
        file.endsWith('.png') &&
        !path.dirname(file) // Only files in the root of the directory
      );

      for (const file of pngFiles) {
        const filePath = path.join(dir, file);
        const baseName = path.parse(file).name;

        // Check if optimized versions exist
        const hasOptimized = await fs.pathExists(path.join(dir, 'md', `${baseName}.webp`));

        if (hasOptimized) {
          await fs.remove(filePath);
          cleanedCount++;
          console.log(chalk.green(`✓ Removed original ${file}`));
        }
      }
    }

    console.log(chalk.green(`🧹 Cleaned up ${cleanedCount} original files`));
  }

  async run() {
    console.log(chalk.bold.blue('🎨 SWGoH Asset Processor'));
    console.log(chalk.blue('================================'));

    // Process all asset types
    await this.processUnitPortraits();
    await this.processUnitIcons();
    await this.processPlanetBackgrounds();

    // Generate optimized manifest
    await this.generateOptimizedManifest();

    // Clean up originals (optional)
    // await this.cleanupOriginals();

    console.log(chalk.bold.green('\n📊 Processing Summary:'));
    console.log(chalk.green(`✓ Processed: ${this.processedCount} images`));
    console.log(chalk.red(`❌ Failed: ${this.failedCount} images`));

    console.log(chalk.bold.green('\n🎉 Asset processing complete!'));
    console.log(chalk.blue('Assets are now optimized and ready for web use.'));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const processor = new AssetProcessor();
  processor.run().catch(error => {
    console.error(chalk.red('💥 Fatal error:'), error);
    process.exit(1);
  });
}

export default AssetProcessor;