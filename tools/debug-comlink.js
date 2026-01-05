#!/usr/bin/env node

/**
 * Debug script to explore Comlink unit data structure
 * Using direct fetch
 */

const COMLINK_URL = 'http://localhost:3200';

async function post(endpoint, body = {}) {
  const response = await fetch(`${COMLINK_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`${endpoint} failed: ${response.status}`);
  }
  return response.json();
}

async function debug() {
  console.log('🔍 Exploring Comlink unit data structure...\n');
  
  try {
    // Get metadata
    const metadata = await post('/metadata', {});
    console.log('Game version:', metadata.latestGamedataVersion);
    console.log('Localization version:', metadata.latestLocalizationBundleVersion);
    
    // Get localization
    console.log('\nFetching localization...');
    const locBundle = await post('/localization', {
      payload: { id: metadata.latestLocalizationBundleVersion + ':ENG_US' },
      unzip: true
    });
    console.log('Localization keys sample:', Object.keys(locBundle).slice(0, 5));
    
    // Get game data - segment 3 has units
    console.log('\nFetching unit data (segment 3)...');
    const gameData = await post('/data', {
      payload: {
        version: metadata.latestGamedataVersion,
        includePveUnits: false,
        requestSegment: 3
      },
      enums: true
    });
    
    console.log('Game data keys:', Object.keys(gameData));
    
    if (gameData.units) {
      console.log(`\nTotal units: ${gameData.units.length}`);
      
      // Show first 3 units with ALL their keys
      console.log('\n--- Sample Unit Data ---');
      for (let i = 0; i < 3; i++) {
        const unit = gameData.units[i];
        console.log(`\nUnit ${i + 1}: ${unit.baseId || unit.id}`);
        console.log('  All keys:', Object.keys(unit).join(', '));
        console.log('  id:', unit.id);
        console.log('  baseId:', unit.baseId);
        console.log('  nameKey:', unit.nameKey);
        console.log('  combatType:', unit.combatType);
        console.log('  thumbnailName:', unit.thumbnailName);
        console.log('  obtainable:', unit.obtainable);
        console.log('  rarity:', unit.rarity);
        console.log('  forceAlignment:', unit.forceAlignment);
        console.log('  categoryId:', unit.categoryId?.slice(0,3));
        
        // Check for display name in localization
        if (unit.nameKey && locBundle[unit.nameKey]) {
          console.log('  ✅ Display Name:', locBundle[unit.nameKey]);
        }
      }
      
      // Look for Darth Vader specifically
      console.log('\n--- Looking for DARTHVADER ---');
      const vader = gameData.units.find(u => u.baseId === 'DARTHVADER');
      if (vader) {
        console.log('Found Darth Vader!');
        console.log('  id:', vader.id);
        console.log('  baseId:', vader.baseId);
        console.log('  nameKey:', vader.nameKey);
        console.log('  combatType:', vader.combatType);
        console.log('  thumbnailName:', vader.thumbnailName);
        console.log('  obtainable:', vader.obtainable);
        console.log('  rarity:', vader.rarity);
        if (vader.nameKey && locBundle[vader.nameKey]) {
          console.log('  ✅ Display Name:', locBundle[vader.nameKey]);
        }
      } else {
        console.log('Not found!');
      }
      
      // Count units by combatType and obtainable
      const stats = {
        combatTypes: {},
        obtainable: { true: 0, false: 0, undefined: 0 },
        hasBaseId: 0,
        hasThumbnail: 0,
        hasNameKey: 0
      };
      
      gameData.units.forEach(u => {
        stats.combatTypes[u.combatType] = (stats.combatTypes[u.combatType] || 0) + 1;
        stats.obtainable[String(u.obtainable)]++;
        if (u.baseId) stats.hasBaseId++;
        if (u.thumbnailName) stats.hasThumbnail++;
        if (u.nameKey) stats.hasNameKey++;
      });
      
      console.log('\n--- Statistics ---');
      console.log('Combat Types:', stats.combatTypes);
      console.log('Obtainable:', stats.obtainable);
      console.log('Has baseId:', stats.hasBaseId);
      console.log('Has thumbnailName:', stats.hasThumbnail);
      console.log('Has nameKey:', stats.hasNameKey);
      
      // Find playable units - those with baseId, thumbnailName, and obtainable
      const playable = gameData.units.filter(u => 
        u.baseId && 
        u.thumbnailName &&
        u.obtainable !== false
      );
      console.log(`\n--- Playable units (baseId + thumbnail + obtainable): ${playable.length} ---`);
      console.log('Characters:', playable.filter(u => u.combatType === 1 || u.combatType === 'CHARACTER').length);
      console.log('Ships:', playable.filter(u => u.combatType === 2 || u.combatType === 'SHIP').length);
      console.log('\nFirst 10:', playable.slice(0, 10).map(u => u.baseId).join(', '));
      
    } else {
      console.log('No units found in response!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debug();
