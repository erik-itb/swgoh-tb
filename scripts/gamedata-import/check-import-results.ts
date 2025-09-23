#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImportResults() {
  console.log('🔍 Checking import results...\n');
  
  try {
    // Count records
    const [unitCount, tbCount, phaseCount] = await Promise.all([
      prisma.unit.count(),
      prisma.territoryBattle.count(), 
      prisma.phase.count()
    ]);
    
    console.log('📊 Database Contents:');
    console.log(`   🎯 Units: ${unitCount}`);
    console.log(`   🏛️ Territory Battles: ${tbCount}`);
    console.log(`   📅 Phases: ${phaseCount}`);
    
    if (unitCount > 0) {
      console.log('\n🎯 Sample Units:');
      const sampleUnits = await prisma.unit.findMany({
        take: 5,
        select: {
          gameId: true,
          name: true,
          unitType: true,
          portraitUrl: true
        }
      });
      
      sampleUnits.forEach((unit, i) => {
        console.log(`   ${i + 1}. ${unit.name} (${unit.gameId}) - ${unit.unitType}`);
        console.log(`      Portrait: ${unit.portraitUrl}`);
      });
    }
    
    if (tbCount > 0) {
      console.log('\n🏛️ Territory Battles:');
      const tbs = await prisma.territoryBattle.findMany({
        include: {
          phases: true
        }
      });
      
      tbs.forEach(tb => {
        console.log(`   📋 ${tb.name} (${tb.slug}) - ${tb.phases.length} phases`);
      });
    }
    
    console.log('\n✅ Import verification complete!');
    
  } catch (error) {
    console.error('❌ Error checking results:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkImportResults();