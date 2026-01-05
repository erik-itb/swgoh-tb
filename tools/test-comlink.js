#!/usr/bin/env node

/**
 * Test Comlink API and explore data structure
 */

const COMLINK_URL = 'http://localhost:3200';

async function testComlink() {
  console.log('🔍 Testing Comlink API...\n');

  try {
    // 1. Get metadata to find game data version
    console.log('1. Fetching metadata...');
    const metadataRes = await fetch(`${COMLINK_URL}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const metadata = await metadataRes.json();
    
    console.log('  ✅ Metadata received');
    console.log('  Latest Game Data Version:', metadata.latestGamedataVersion);
    console.log('  Latest Localization Version:', metadata.latestLocalizationBundleVersion);
    
    // 2. Get units data (segment 3 contains units)
    console.log('\n2. Fetching units data (this may take a moment)...');
    const unitsRes = await fetch(`${COMLINK_URL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: {
          version: metadata.latestGamedataVersion,
          includePveUnits: false,
          requestSegment: 3  // Segment 3 contains units
        },
        enums: true
      })
    });
    const gameData = await unitsRes.json();
    
    console.log('  ✅ Game data received');
    console.log('  Available keys:', Object.keys(gameData).join(', '));
    
    if (gameData.units) {
      console.log(`  Total units: ${gameData.units.length}`);
      
      // Show structure of first few units
      console.log('\n3. Sample unit data:');
      const sampleUnits = gameData.units.slice(0, 3);
      
      for (const unit of sampleUnits) {
        console.log(`\n  📌 ${unit.baseId || unit.id}`);
        console.log(`    - nameKey: ${unit.nameKey}`);
        console.log(`    - combatType: ${unit.combatType}`);
        console.log(`    - thumbnailName: ${unit.thumbnailName}`);
        console.log(`    - forceAlignment: ${unit.forceAlignment}`);
        
        // Check for any image/portrait related fields
        const imageFields = Object.keys(unit).filter(k => 
          k.toLowerCase().includes('image') || 
          k.toLowerCase().includes('portrait') ||
          k.toLowerCase().includes('thumbnail') ||
          k.toLowerCase().includes('icon') ||
          k.toLowerCase().includes('tex')
        );
        if (imageFields.length > 0) {
          console.log(`    - Image-related fields: ${imageFields.join(', ')}`);
          for (const field of imageFields) {
            console.log(`      ${field}: ${unit[field]}`);
          }
        }
      }
      
      // Look for a specific unit like DARTHVADER
      console.log('\n4. Looking for DARTHVADER...');
      const vader = gameData.units.find(u => u.baseId === 'DARTHVADER');
      if (vader) {
        console.log('  Found Darth Vader!');
        console.log('  Full unit data (first 20 keys):');
        const keys = Object.keys(vader).slice(0, 20);
        for (const key of keys) {
          const value = vader[key];
          const display = typeof value === 'object' ? JSON.stringify(value).substring(0, 60) : value;
          console.log(`    ${key}: ${display}`);
        }
      }
    }
    
    console.log('\n✅ Comlink test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testComlink();
