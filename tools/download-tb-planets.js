// Script to download TB3 planet backdrop images from asset extractor
const fs = require('fs');
const path = require('path');
const http = require('http');

const ASSET_EXTRACTOR_URL = 'http://localhost:3001';
const ASSET_VERSION = '36557';
const OUTPUT_DIR = path.join(process.cwd(), 'assets', 'temp-planets');

// Mapping of our planet IDs to asset extractor asset names
// Based on actual assets found: territory_backdrop_tb3_*
const PLANET_ASSETS = {
  'mustafar': 'territory_backdrop_tb3_mustafar',
  'corellia': 'territory_backdrop_tb3_corellia',
  'coruscant': 'territory_backdrop_tb3_coruscant',
  'geonosis': 'territory_backdrop_tb3_geonosis',
  'felucia': 'territory_backdrop_tb3_felucia',
  'bracca': 'territory_backdrop_tb3_bracca',
  'dathomir': 'territory_backdrop_tb3_dathomir',
  'tatooine': 'territory_backdrop_tb3_tatooine',
  'kashyyyk': 'territory_backdrop_tb3_kashyyyk',
  'zeffo': 'territory_backdrop_tb3_zeffo',
  'medstation': 'territory_backdrop_tb3_medstation',
  'kessel': 'territory_backdrop_tb3_kessel',
  'lothal': 'territory_backdrop_tb3_lothal',
  'mandalore': 'territory_backdrop_tb3_mandalore',
  'malachor': 'territory_backdrop_tb3_malachor',
  'vandor': 'territory_backdrop_tb3_vandor',
  'kafrene': 'territory_backdrop_tb3_kafrene',
  'deathstar': 'territory_backdrop_tb3_deathstar',
  'hoth': 'territory_backdrop_tb3_hoth',
  'scarif': 'territory_backdrop_tb3_scarif'
};

function downloadAsset(assetName, outputPath) {
  return new Promise((resolve, reject) => {
    const url = `${ASSET_EXTRACTOR_URL}/Asset/single?assetName=${encodeURIComponent(assetName)}&version=${ASSET_VERSION}&assetOS=0`;
    
    console.log(`  Downloading: ${url}`);
    
    http.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 1000) {
          reject(new Error(`File too small (${buffer.length} bytes)`));
          return;
        }
        fs.writeFileSync(outputPath, buffer);
        resolve(buffer.length);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log('🔍 Downloading TB3 planet backdrops from asset extractor...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  
  let downloaded = 0;
  let failed = 0;
  
  for (const [planet, assetName] of Object.entries(PLANET_ASSETS)) {
    try {
      const outputPath = path.join(OUTPUT_DIR, `${planet}.png`);
      const size = await downloadAsset(assetName, outputPath);
      console.log(`✅ ${planet} - ${(size / 1024).toFixed(1)}KB`);
      downloaded++;
    } catch (err) {
      console.log(`❌ ${planet} - ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Summary: ${downloaded} downloaded, ${failed} failed`);
}

main().catch(console.error);
