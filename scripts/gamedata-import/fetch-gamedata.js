#!/usr/bin/env node

/**
 * SWGoH GameData Fetcher
 * Downloads the latest game data from swgoh-utils/gamedata repository
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const GAMEDATA_BASE_URL = 'https://raw.githubusercontent.com/swgoh-utils/gamedata/main';
const DATA_DIR = path.join(__dirname, '../../data/gamedata');

// Files we need for the TB tracker
const REQUIRED_FILES = [
  'units.json',
  'units_pve.json', 
  'territoryBattleDefinition.json',
  'Loc_ENG_US.txt.json',
  'ability.json',
  'skill.json',
  'equipment.json'
];

/**
 * Download a file from GitHub
 */
async function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${GAMEDATA_BASE_URL}/${filename}`;
    const outputPath = path.join(DATA_DIR, filename);
    
    console.log(`📦 Downloading ${filename}...`);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', async () => {
        try {
          // Validate JSON
          const parsed = JSON.parse(data);
          
          // Write to file
          await fs.writeFile(outputPath, JSON.stringify(parsed, null, 2));
          
          // Log stats
          const stats = {
            version: parsed.version || 'unknown',
            dataCount: Array.isArray(parsed.data) ? parsed.data.length : 'N/A',
            fileSize: Math.round(data.length / 1024) + 'KB'
          };
          
          console.log(`   ✅ ${filename} - Version: ${stats.version}, Records: ${stats.dataCount}, Size: ${stats.fileSize}`);
          resolve(stats);
        } catch (error) {
          reject(new Error(`Failed to parse ${filename}: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Main download function
 */
async function fetchGameData() {
  console.log('🚀 SWGoH GameData Fetcher Starting...\n');
  console.log(`📂 Data directory: ${DATA_DIR}`);
  
  // Ensure data directory exists
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  const results = [];
  let successCount = 0;
  
  // Download all required files
  for (const filename of REQUIRED_FILES) {
    try {
      const stats = await downloadFile(filename);
      results.push({ filename, success: true, ...stats });
      successCount++;
    } catch (error) {
      console.error(`   ❌ ${filename} - Error: ${error.message}`);
      results.push({ filename, success: false, error: error.message });
    }
  }
  
  // Generate summary
  console.log(`\n📊 Download Summary:`);
  console.log(`   ✅ Successful: ${successCount}/${REQUIRED_FILES.length}`);
  console.log(`   ❌ Failed: ${REQUIRED_FILES.length - successCount}/${REQUIRED_FILES.length}`);
  
  // Save download metadata
  const metadata = {
    downloadTime: new Date().toISOString(),
    results,
    success: successCount === REQUIRED_FILES.length
  };
  
  await fs.writeFile(
    path.join(DATA_DIR, '_download_metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  if (metadata.success) {
    console.log('\n🎉 All game data downloaded successfully!');
    console.log('📁 Files available in:', DATA_DIR);
  } else {
    console.log('\n⚠️  Some downloads failed. Check errors above.');
    process.exit(1);
  }
  
  return metadata;
}

// Execute if run directly
if (require.main === module) {
  fetchGameData().catch(error => {
    console.error('💥 Download failed:', error.message);
    process.exit(1);
  });
}

module.exports = { fetchGameData };