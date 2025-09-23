#!/usr/bin/env npx tsx

/**
 * SWGoH Database Import Script
 * Imports gamedata from JSON files into Prisma database
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '../../data/gamedata');

// Asset URL generator
const generateAssetUrl = (baseId: string, type: 'portrait' | 'icon' = 'portrait') => {
  const endpoint = type === 'portrait' ? 'char' : 'char';
  return `https://api.swgoh.help/image/${endpoint}/${baseId}`;
};

/**
 * Load and parse JSON file
 */
async function loadGameData(filename: string) {
  const filepath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filepath, 'utf-8');
  const parsed = JSON.parse(content);
  
  console.log(`📂 Loaded ${filename}: Version ${parsed.version}, ${Array.isArray(parsed.data) ? parsed.data.length : 0} records`);
  
  return parsed.data || parsed;
}

/**
 * Load localization data and create lookup map
 */
async function loadLocalization() {
  const locData = await loadGameData('Loc_ENG_US.txt.json');
  const locMap = new Map<string, string>();
  
  // Handle both array format and object format
  const locArray = Array.isArray(locData) ? locData : Object.values(locData);
  
  for (const item of locArray) {
    if (typeof item === 'object' && item.key && item.value) {
      locMap.set(item.key, item.value);
    }
  }
  
  console.log(`🌐 Loaded ${locMap.size} localization entries`);
  return locMap;
}

/**
 * Import Units into database
 */
async function importUnits() {
  console.log('\n🎯 Importing Units...');
  
  const [unitsData, locMap] = await Promise.all([
    loadGameData('units.json'),
    loadLocalization()
  ]);
  
  let imported = 0;
  let skipped = 0;
  
  for (const unit of unitsData) {
    try {
      const baseId = unit.baseId;
      if (!baseId) {
        skipped++;
        continue;
      }
      
      // Get localized name
      const nameKey = unit.nameKey;
      const localizedName = nameKey ? locMap.get(nameKey) : null;
      
      // Determine unit type
      let unitType = 'CHARACTER';
      if (unit.combatType === 2) unitType = 'SHIP';
      if (unit.categoryId?.includes('capitalship')) unitType = 'CAPITAL_SHIP';
      
      // Determine alignment
      let alignment = 'NEUTRAL';
      if (unit.forceAlignment === 1) alignment = 'LIGHT_SIDE';
      if (unit.forceAlignment === 2) alignment = 'DARK_SIDE';
      
      // Extract factions and tags
      const factions = unit.categoryId ? unit.categoryId.filter((c: string) => 
        !['role_', 'unit_class_', 'alignment_'].some(prefix => c.startsWith(prefix))
      ) : [];
      
      const tags = unit.categoryId ? unit.categoryId.filter((c: string) => 
        c.startsWith('role_') || c.startsWith('unit_class_')
      ) : [];
      
      // Create or update unit
      await prisma.unit.upsert({
        where: { gameId: baseId },
        update: {
          name: localizedName || nameKey || baseId,
          unitType: unitType as any,
          alignment: alignment as any,
          factions,
          tags,
          portraitUrl: generateAssetUrl(baseId, 'portrait'),
          iconUrl: generateAssetUrl(baseId, 'icon'),
          isActive: true
        },
        create: {
          gameId: baseId,
          name: localizedName || nameKey || baseId,
          unitType: unitType as any,
          alignment: alignment as any,
          factions,
          tags,
          portraitUrl: generateAssetUrl(baseId, 'portrait'),
          iconUrl: generateAssetUrl(baseId, 'icon'),
          isActive: true
        }
      });
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   📊 Imported ${imported} units...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to import unit ${unit.baseId}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`   ✅ Units import complete: ${imported} imported, ${skipped} skipped`);
  return { imported, skipped };
}

/**
 * Import Territory Battles
 */
async function importTerritoryBattles() {
  console.log('\n🏛️ Importing Territory Battles...');
  
  const [tbData, locMap] = await Promise.all([
    loadGameData('territoryBattleDefinition.json'),
    loadLocalization()
  ]);
  
  let imported = 0;
  
  for (const tb of tbData) {
    try {
      const tbId = tb.id;
      if (!tbId) continue;
      
      // Get localized name
      const nameKey = tb.nameKey;
      const localizedName = nameKey ? locMap.get(nameKey) : null;
      
      // Create slug from ID
      const slug = tbId.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Create or update territory battle
      const territoryBattle = await prisma.territoryBattle.upsert({
        where: { slug },
        update: {
          name: localizedName || nameKey || tbId,
          description: tb.description || `Territory Battle: ${localizedName || tbId}`,
          totalPhases: tb.conflictZoneDefinitions?.length || 6,
          isActive: true
        },
        create: {
          name: localizedName || nameKey || tbId,
          slug,
          description: tb.description || `Territory Battle: ${localizedName || tbId}`,
          totalPhases: tb.conflictZoneDefinitions?.length || 6,
          isActive: true
        }
      });
      
      // Import phases
      if (tb.conflictZoneDefinitions && tb.conflictZoneDefinitions.length > 0) {
        for (let i = 0; i < tb.conflictZoneDefinitions.length; i++) {
          const zone = tb.conflictZoneDefinitions[i];
          
          await prisma.phase.upsert({
            where: {
              territoryBattleId_phaseNumber: {
                territoryBattleId: territoryBattle.id,
                phaseNumber: i + 1
              }
            },
            update: {
              name: `Phase ${i + 1}`,
              relicRequirement: zone.minimumRelicTier ? `Relic ${zone.minimumRelicTier}+` : null
            },
            create: {
              territoryBattleId: territoryBattle.id,
              phaseNumber: i + 1,
              name: `Phase ${i + 1}`,
              relicRequirement: zone.minimumRelicTier ? `Relic ${zone.minimumRelicTier}+` : null
            }
          });
        }
      }
      
      imported++;
      console.log(`   ✅ Imported TB: ${localizedName || tbId} (${tb.conflictZoneDefinitions?.length || 0} phases)`);
      
    } catch (error) {
      console.error(`   ❌ Failed to import TB ${tb.id}:`, error.message);
    }
  }
  
  console.log(`   ✅ Territory Battles import complete: ${imported} imported`);
  return { imported };
}

/**
 * Main import function
 */
async function importGameData() {
  console.log('🚀 Starting SWGoH Database Import...\n');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('📊 Database connected successfully');
    
    // Import data
    const unitsResult = await importUnits();
    const tbResult = await importTerritoryBattles();
    
    // Summary
    console.log('\n📈 Import Summary:');
    console.log(`   🎯 Units: ${unitsResult.imported} imported, ${unitsResult.skipped} skipped`);
    console.log(`   🏛️ Territory Battles: ${tbResult.imported} imported`);
    console.log('\n🎉 Database import completed successfully!');
    
    // Verify data
    const unitCount = await prisma.unit.count();
    const tbCount = await prisma.territoryBattle.count();
    const phaseCount = await prisma.phase.count();
    
    console.log('\n🔍 Database Verification:');
    console.log(`   📊 Total Units in DB: ${unitCount}`);
    console.log(`   🏛️ Total Territory Battles in DB: ${tbCount}`);
    console.log(`   📅 Total Phases in DB: ${phaseCount}`);
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  importGameData();
}

export { importGameData };