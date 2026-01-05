#!/usr/bin/env node

/**
 * Create High-Quality Fallback Assets
 * Generates professional-looking placeholder images for characters and ships
 */

const fs = require('fs').promises;
const path = require('path');

class FallbackAssetCreator {
  constructor() {
    this.assetsDir = path.resolve(__dirname, '../assets');
    this.fallbackDir = path.resolve(this.assetsDir, 'fallback');
    this.charactersDir = path.resolve(this.assetsDir, 'characters');
    this.shipsDir = path.resolve(this.assetsDir, 'ships');
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
   * Create high-quality SVG fallback images
   */
  async createFallbackSVGs() {
    console.log('\n🎨 Creating high-quality fallback SVG assets...');

    const characterSvg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="characterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2D5BFF;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="256" height="256" fill="#1A202C" rx="8"/>
  
  <!-- Character silhouette -->
  <circle cx="128" cy="100" r="45" fill="url(#characterGrad)" filter="url(#shadow)"/>
  <rect x="83" y="145" width="90" height="80" rx="45" fill="url(#characterGrad)" filter="url(#shadow)"/>
  
  <!-- Border -->
  <rect width="256" height="256" fill="none" stroke="#4A90E2" stroke-width="2" rx="8"/>
  
  <!-- Text -->
  <text x="128" y="240" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="14" font-weight="bold">CHARACTER</text>
</svg>`.trim();

    const shipSvg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EE5A24;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="256" height="256" fill="#1A202C" rx="8"/>
  
  <!-- Ship silhouette -->
  <polygon points="128,60 200,140 180,180 128,160 76,180 56,140" fill="url(#shipGrad)" filter="url(#shadow)"/>
  <circle cx="128" cy="140" r="15" fill="#FFF" opacity="0.8"/>
  <circle cx="100" cy="160" r="8" fill="#FFF" opacity="0.6"/>
  <circle cx="156" cy="160" r="8" fill="#FFF" opacity="0.6"/>
  
  <!-- Border -->
  <rect width="256" height="256" fill="none" stroke="#FF6B6B" stroke-width="2" rx="8"/>
  
  <!-- Text -->
  <text x="128" y="240" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="14" font-weight="bold">SHIP</text>
</svg>`.trim();

    const unknownSvg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="unknownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#718096;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4A5568;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="256" height="256" fill="#2D3748" rx="8"/>
  
  <!-- Question mark -->
  <circle cx="128" cy="128" r="80" fill="url(#unknownGrad)" stroke="#E2E8F0" stroke-width="3"/>
  <text x="128" y="150" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="72" font-weight="bold">?</text>
  
  <!-- Border -->
  <rect width="256" height="256" fill="none" stroke="#718096" stroke-width="2" rx="8"/>
  
  <!-- Text -->
  <text x="128" y="240" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="14" font-weight="bold">UNKNOWN</text>
</svg>`.trim();

    const fallbacks = [
      { name: 'character-portrait.svg', content: characterSvg },
      { name: 'character-icon.svg', content: characterSvg },
      { name: 'ship-portrait.svg', content: shipSvg },
      { name: 'ship-icon.svg', content: shipSvg },
      { name: 'unknown-unit.svg', content: unknownSvg }
    ];

    for (const fallback of fallbacks) {
      const fallbackPath = path.join(this.fallbackDir, fallback.name);
      await fs.writeFile(fallbackPath, fallback.content);
      console.log(`  ✅ Created: ${fallback.name}`);
    }
  }

  /**
   * Create sample character assets for testing
   */
  async createSampleAssets() {
    console.log('\n🎭 Creating sample character assets for testing...');

    const sampleCharacters = [
      'COMMANDERLUKESKYWALKER',
      'PRINCESSLEIA', 
      'HANSOLO',
      'DARTHVADER',
      'JEDIKNIGHTREVAN'
    ];

    const sampleShips = [
      'MILLENNIUMFALCON',
      'YWINGREBEL',
      'XWINGREBEL'
    ];

    // Create character-specific colored placeholders
    const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE'];
    
    for (let i = 0; i < sampleCharacters.length; i++) {
      const character = sampleCharacters[i];
      const color = colors[i];
      
      const svg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}AA;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="256" height="256" fill="#1A202C" rx="8"/>
  
  <!-- Character silhouette -->
  <circle cx="128" cy="100" r="45" fill="url(#grad${i})"/>
  <rect x="83" y="145" width="90" height="80" rx="45" fill="url(#grad${i})"/>
  
  <!-- Border -->
  <rect width="256" height="256" fill="none" stroke="${color}" stroke-width="2" rx="8"/>
  
  <!-- Character name -->
  <text x="128" y="235" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${character.substring(0, 12)}</text>
  <text x="128" y="250" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${character.substring(12)}</text>
</svg>`.trim();

      const assetPath = path.join(this.charactersDir, `${character}.svg`);
      await fs.writeFile(assetPath, svg);
      console.log(`  ✅ Created sample: ${character}.svg`);
    }

    // Create ship placeholders
    for (let i = 0; i < sampleShips.length; i++) {
      const ship = sampleShips[i];
      const color = colors[i + 2]; // Offset colors for ships
      
      const svg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shipGrad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}AA;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="256" height="256" fill="#1A202C" rx="8"/>
  
  <!-- Ship silhouette -->
  <polygon points="128,60 200,140 180,180 128,160 76,180 56,140" fill="url(#shipGrad${i})"/>
  <circle cx="128" cy="140" r="15" fill="#FFF" opacity="0.8"/>
  
  <!-- Border -->
  <rect width="256" height="256" fill="none" stroke="${color}" stroke-width="2" rx="8"/>
  
  <!-- Ship name -->
  <text x="128" y="235" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${ship.substring(0, 12)}</text>
  <text x="128" y="250" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${ship.substring(12)}</text>
</svg>`.trim();

      const assetPath = path.join(this.shipsDir, `${ship}.svg`);
      await fs.writeFile(assetPath, svg);
      console.log(`  ✅ Created sample: ${ship}.svg`);
    }
  }

  /**
   * Generate comprehensive asset manifest
   */
  async generateManifest() {
    console.log('\n📄 Generating comprehensive asset manifest...');
    
    const manifest = {
      generated: new Date().toISOString(),
      version: '2.0.0',
      source: 'local-fallback',
      description: 'Local fallback assets for SWGoH TB Tracker',
      structure: {
        fallback: '/assets/fallback/',
        characters: '/assets/characters/',
        ships: '/assets/ships/'
      },
      assets: {
        fallbacks: [],
        characters: [],
        ships: []
      },
      sources: {
        primary: 'swgoh.gg (external)',
        secondary: 'swgoh.help (external)', 
        local: 'SVG placeholders'
      },
      instructions: {
        usage: 'These are high-quality SVG fallback assets. External APIs (swgoh.gg, swgoh.help) should be tried first.',
        integration: 'Frontend should use multi-source strategy: external -> local fallback',
        development: 'Sample assets included for testing and development'
      }
    };

    // Scan created assets
    try {
      const fallbackFiles = await fs.readdir(this.fallbackDir);
      manifest.assets.fallbacks = fallbackFiles.filter(file => file.endsWith('.svg'));
    } catch (error) {
      console.log('  No fallback assets found');
    }

    try {
      const characterFiles = await fs.readdir(this.charactersDir);
      manifest.assets.characters = characterFiles
        .filter(file => file.endsWith('.svg'))
        .map(file => path.parse(file).name);
    } catch (error) {
      console.log('  No character assets found');
    }

    try {
      const shipFiles = await fs.readdir(this.shipsDir);
      manifest.assets.ships = shipFiles
        .filter(file => file.endsWith('.svg'))
        .map(file => path.parse(file).name);
    } catch (error) {
      console.log('  No ship assets found');
    }

    const manifestPath = path.join(this.assetsDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`  ✅ Manifest created:`);
    console.log(`    📁 Fallbacks: ${manifest.assets.fallbacks.length}`);
    console.log(`    👥 Characters: ${manifest.assets.characters.length}`);
    console.log(`    🚀 Ships: ${manifest.assets.ships.length}`);
    
    return manifest;
  }

  /**
   * Create .gitkeep files to ensure directories are tracked
   */
  async createGitkeepFiles() {
    console.log('\n📌 Creating .gitkeep files...');
    
    const dirs = [this.fallbackDir, this.charactersDir, this.shipsDir];
    
    for (const dir of dirs) {
      const gitkeepPath = path.join(dir, '.gitkeep');
      await fs.writeFile(gitkeepPath, '# Keep this directory in git\n');
      console.log(`  ✅ Created: ${path.relative(process.cwd(), gitkeepPath)}`);
    }
  }

  /**
   * Run complete fallback asset creation process
   */
  async run() {
    console.log('🎨 Creating High-Quality Fallback Assets');
    console.log('=======================================');
    
    try {
      // Setup
      await this.createDirectories();
      
      // Create high-quality fallbacks
      await this.createFallbackSVGs();
      
      // Create sample assets for development
      await this.createSampleAssets();
      
      // Generate manifest
      const manifest = await this.generateManifest();
      
      // Git tracking
      await this.createGitkeepFiles();
      
      // Summary
      console.log('\n🎉 Asset Creation Complete!');
      console.log(`📁 Assets directory: ${path.relative(process.cwd(), this.assetsDir)}`);
      console.log('\n📊 Created Assets:');
      console.log(`  🎨 Fallback SVGs: ${manifest.assets.fallbacks.length}`);
      console.log(`  👥 Sample Characters: ${manifest.assets.characters.length}`);
      console.log(`  🚀 Sample Ships: ${manifest.assets.ships.length}`);
      
      console.log('\n💡 Next Steps:');
      console.log('  1. ✅ Asset structure ready');
      console.log('  2. ✅ High-quality fallbacks created');
      console.log('  3. ✅ Sample assets for testing');
      console.log('  4. 🔄 External APIs will be tried first');
      console.log('  5. 🎯 Ready for web app development!');
      
    } catch (error) {
      console.error('\n❌ Asset creation process failed:', error);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const creator = new FallbackAssetCreator();
  creator.run().catch(console.error);
}

module.exports = FallbackAssetCreator;