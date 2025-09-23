#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const assetsDir = path.join(projectRoot, 'assets');
const dataDir = path.join(projectRoot, 'data');

class AssetValidator {
  constructor() {
    this.totalAssets = 0;
    this.missingAssets = 0;
    this.validAssets = 0;
    this.corruptAssets = 0;
  }

  async loadUnitsData() {
    const unitsPath = path.join(dataDir, 'gamedata/units.json');
    if (!await fs.pathExists(unitsPath)) {
      throw new Error('Units data not found. Please download gamedata first.');
    }

    const unitsData = JSON.parse(await fs.readFile(unitsPath, 'utf-8'));
    return unitsData.data.filter(unit => unit.combatType === 1); // Characters only
  }

  async validateFileIntegrity(filePath) {
    try {
      const stats = await fs.stat(filePath);

      // Check if file is empty
      if (stats.size === 0) {
        return { valid: false, reason: 'empty file' };
      }

      // Check if file is suspiciously small (< 1KB for images)
      if (stats.size < 1024) {
        return { valid: false, reason: 'file too small' };
      }

      return { valid: true, size: stats.size };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  async validateAssetDirectory(dirPath, expectedAssets, assetType) {
    console.log(chalk.blue(`🔍 Validating ${assetType}...`));

    if (!await fs.pathExists(dirPath)) {
      console.warn(chalk.yellow(`⚠️  Directory not found: ${dirPath}`));
      return { found: 0, missing: expectedAssets.length, corrupted: 0 };
    }

    const files = await fs.readdir(dirPath);
    let found = 0;
    let missing = 0;
    let corrupted = 0;
    const missingList = [];
    const corruptedList = [];

    for (const expectedAsset of expectedAssets) {
      const webpFile = `${expectedAsset}.webp`;
      const pngFile = `${expectedAsset}.png`;

      // Check for either webp or png version
      const webpPath = path.join(dirPath, webpFile);
      const pngPath = path.join(dirPath, pngFile);

      let assetPath = null;
      if (await fs.pathExists(webpPath)) {
        assetPath = webpPath;
      } else if (await fs.pathExists(pngPath)) {
        assetPath = pngPath;
      }

      if (assetPath) {
        const validation = await this.validateFileIntegrity(assetPath);
        if (validation.valid) {
          found++;
        } else {
          corrupted++;
          corruptedList.push(`${expectedAsset} (${validation.reason})`);
        }
      } else {
        missing++;
        missingList.push(expectedAsset);
      }
    }

    console.log(chalk.green(`✓ Found: ${found}`));
    console.log(chalk.yellow(`⚠️  Missing: ${missing}`));
    console.log(chalk.red(`❌ Corrupted: ${corrupted}`));

    if (missingList.length > 0 && missingList.length <= 10) {
      console.log(chalk.yellow(`   Missing assets: ${missingList.slice(0, 5).join(', ')}${missingList.length > 5 ? '...' : ''}`));
    }

    if (corruptedList.length > 0) {
      console.log(chalk.red(`   Corrupted assets: ${corruptedList.slice(0, 3).join(', ')}${corruptedList.length > 3 ? '...' : ''}`));
    }

    return { found, missing, corrupted };
  }

  async validateCharacterPortraits() {
    const units = await this.loadUnitsData();
    const expectedAssets = units
      .map(unit => `charui_${unit.baseId.toLowerCase()}`)
      .slice(0, 100); // Limit for testing

    const portraitsDir = path.join(assetsDir, 'units/portraits');
    return await this.validateAssetDirectory(portraitsDir, expectedAssets, 'character portraits');
  }

  async validateCharacterIcons() {
    const units = await this.loadUnitsData();
    const expectedAssets = units
      .map(unit => `char_${unit.baseId.toLowerCase()}`)
      .slice(0, 100); // Limit for testing

    const iconsDir = path.join(assetsDir, 'units/icons');
    return await this.validateAssetDirectory(iconsDir, expectedAssets, 'character icons');
  }

  async checkManifestConsistency() {
    console.log(chalk.blue('📋 Checking manifest consistency...'));

    const manifestPath = path.join(assetsDir, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      console.warn(chalk.yellow('⚠️  No manifest found. Run asset download first.'));
      return false;
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    let consistencyIssues = 0;

    for (const [assetType, assets] of Object.entries(manifest.assets)) {
      console.log(chalk.blue(`🔍 Checking ${assetType}...`));

      for (const asset of assets) {
        const fullPath = path.join(projectRoot, asset.path);

        if (!await fs.pathExists(fullPath)) {
          console.warn(chalk.yellow(`⚠️  Manifest references missing file: ${asset.path}`));
          consistencyIssues++;
        }
      }
    }

    if (consistencyIssues === 0) {
      console.log(chalk.green('✓ Manifest is consistent with filesystem'));
    } else {
      console.warn(chalk.yellow(`⚠️  Found ${consistencyIssues} consistency issues`));
    }

    return consistencyIssues === 0;
  }

  async generateCoverageReport() {
    console.log(chalk.blue('📊 Generating coverage report...'));

    const units = await this.loadUnitsData();
    const totalCharacters = units.length;

    const report = {
      generated: new Date().toISOString(),
      total_characters: totalCharacters,
      coverage: {
        portraits: { found: 0, missing: 0, coverage_percent: 0 },
        icons: { found: 0, missing: 0, coverage_percent: 0 }
      },
      asset_health: {
        valid_assets: this.validAssets,
        corrupted_assets: this.corruptAssets,
        health_percent: 0
      }
    };

    // Calculate coverage percentages
    for (const assetType of Object.keys(report.coverage)) {
      const coverage = report.coverage[assetType];
      const total = coverage.found + coverage.missing;
      coverage.coverage_percent = total > 0 ? Math.round((coverage.found / total) * 100) : 0;
    }

    // Calculate health percentage
    const totalValidated = this.validAssets + this.corruptAssets;
    report.asset_health.health_percent = totalValidated > 0
      ? Math.round((this.validAssets / totalValidated) * 100)
      : 0;

    const reportPath = path.join(assetsDir, 'validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(chalk.green(`✓ Coverage report saved to ${reportPath}`));
    return report;
  }

  async run() {
    console.log(chalk.bold.blue('🔍 SWGoH Asset Validator'));
    console.log(chalk.blue('================================'));

    try {
      // Validate character portraits
      const portraitResults = await this.validateCharacterPortraits();
      this.validAssets += portraitResults.found;
      this.missingAssets += portraitResults.missing;
      this.corruptAssets += portraitResults.corrupted;

      // Validate character icons
      const iconResults = await this.validateCharacterIcons();
      this.validAssets += iconResults.found;
      this.missingAssets += iconResults.missing;
      this.corruptAssets += iconResults.corrupted;

      // Check manifest consistency
      await this.checkManifestConsistency();

      // Generate coverage report
      await this.generateCoverageReport();

      console.log(chalk.bold.green('\n📊 Validation Summary:'));
      console.log(chalk.green(`✓ Valid assets: ${this.validAssets}`));
      console.log(chalk.yellow(`⚠️  Missing assets: ${this.missingAssets}`));
      console.log(chalk.red(`❌ Corrupted assets: ${this.corruptAssets}`));

      const totalChecked = this.validAssets + this.corruptAssets;
      const healthPercent = totalChecked > 0 ? Math.round((this.validAssets / totalChecked) * 100) : 0;
      console.log(chalk.blue(`💊 Asset health: ${healthPercent}%`));

      if (this.corruptAssets > 0) {
        console.log(chalk.yellow('\n⚠️  Consider re-downloading corrupted assets'));
      }

    } catch (error) {
      console.error(chalk.red('💥 Validation failed:'), error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new AssetValidator();
  validator.run().catch(error => {
    console.error(chalk.red('💥 Fatal error:'), error);
    process.exit(1);
  });
}

export default AssetValidator;