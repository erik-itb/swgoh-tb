import { PrismaClient, UserRole, Alignment, MissionType, CombatType, UnitType, SquadType, Platform } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN
    }
  });
  console.log('✅ Created admin user');

  // Create Rise of the Empire TB
  const tb = await prisma.territoryBattle.create({
    data: {
      name: 'Rise of the Empire',
      slug: 'rise-of-the-empire',
      description: 'Classic Territory Battle featuring Imperial forces and Rebellion conflicts',
      totalPhases: 6
    }
  });
  console.log('✅ Created Territory Battle');

  // Create phases
  const phases = await Promise.all([
    prisma.phase.create({
      data: {
        territoryBattleId: tb.id,
        phaseNumber: 1,
        name: 'Phase 1 (Zone 1)',
        relicRequirement: 'Relic 5+',
        startGpRequirement: BigInt(100000000)
      }
    }),
    prisma.phase.create({
      data: {
        territoryBattleId: tb.id,
        phaseNumber: 2,
        name: 'Phase 2 (Zone 2)',
        relicRequirement: 'Relic 6+',
        startGpRequirement: BigInt(150000000)
      }
    }),
    prisma.phase.create({
      data: {
        territoryBattleId: tb.id,
        phaseNumber: 3,
        name: 'Phase 3 (Zone 3)',
        relicRequirement: 'Relic 7+',
        startGpRequirement: BigInt(200000000)
      }
    }),
    prisma.phase.create({
      data: {
        territoryBattleId: tb.id,
        phaseNumber: 4,
        name: 'Phase 4 (Zone 4)',
        relicRequirement: 'Relic 8+',
        startGpRequirement: BigInt(250000000)
      }
    }),
    prisma.phase.create({
      data: {
        territoryBattleId: tb.id,
        phaseNumber: 5,
        name: 'Phase 5 (Zone 5)',
        relicRequirement: 'Relic 9+',
        startGpRequirement: BigInt(300000000)
      }
    }),
    prisma.phase.create({
      data: {
        territoryBattleId: tb.id,
        phaseNumber: 6,
        name: 'Phase 6 (Zone 6)',
        relicRequirement: 'Relic 9+',
        startGpRequirement: BigInt(350000000)
      }
    })
  ]);
  console.log('✅ Created 6 phases');

  // Create planets for Phase 1
  const mustafar = await prisma.planet.create({
    data: {
      phaseId: phases[0].id,
      name: 'Mustafar',
      slug: 'mustafar',
      alignment: Alignment.DARK_SIDE,
      starRequirements: {
        1: 116406250,
        2: 186250000,
        3: 248333333
      }
    }
  });

  const corellia = await prisma.planet.create({
    data: {
      phaseId: phases[0].id,
      name: 'Corellia',
      slug: 'corellia',
      alignment: Alignment.MIXED,
      starRequirements: {
        1: 113203125,
        2: 181125000,
        3: 241500000
      }
    }
  });

  const coruscant = await prisma.planet.create({
    data: {
      phaseId: phases[0].id,
      name: 'Coruscant',
      slug: 'coruscant',
      alignment: Alignment.LIGHT_SIDE,
      starRequirements: {
        1: 111718750,
        2: 178750000,
        3: 238333333
      }
    }
  });

  // Create sample planets for other phases
  await prisma.planet.createMany({
    data: [
      // Phase 2
      { phaseId: phases[1].id, name: 'Geonosis', slug: 'geonosis', alignment: Alignment.DARK_SIDE, starRequirements: { 1: 148125000, 2: 237000000, 3: 316000000 } },
      { phaseId: phases[1].id, name: 'Felucia', slug: 'felucia', alignment: Alignment.MIXED, starRequirements: { 1: 143906250, 2: 230250000, 3: 307000000 } },
      { phaseId: phases[1].id, name: 'Bracca', slug: 'bracca', alignment: Alignment.LIGHT_SIDE, starRequirements: { 1: 142265625, 2: 227625000, 3: 303500000 } },
      // Phase 3
      { phaseId: phases[2].id, name: 'Dathomir', slug: 'dathomir', alignment: Alignment.DARK_SIDE, starRequirements: { 1: 154921875, 2: 247875000, 3: 330500000 } },
      { phaseId: phases[2].id, name: 'Tatooine', slug: 'tatooine', alignment: Alignment.MIXED, starRequirements: { 1: 190953125, 2: 305525000, 3: 407366667 } },
      { phaseId: phases[2].id, name: 'Kashyyyk', slug: 'kashyyyk', alignment: Alignment.LIGHT_SIDE, starRequirements: { 1: 143589583, 2: 229743333, 3: 306324444 } },
      { phaseId: phases[2].id, name: 'Zeffo', slug: 'zeffo', alignment: Alignment.LIGHT_SIDE, starRequirements: { 1: 147552083, 2: 236083333, 3: 287179167 }, isBonusPlanet: true, unlockRequirement: 'Complete Kashyyyk missions' }
    ]
  });
  console.log('✅ Created planets');

  // Create sample units
  const units = await prisma.unit.createMany({
    data: [
      // Empire
      { gameId: 'EMPERORPALPATINE', name: 'Emperor Palpatine', unitType: UnitType.CHARACTER, alignment: Alignment.DARK_SIDE, factions: ['empire', 'sith'], tags: ['leader', 'support'] },
      { gameId: 'DARTHVADER', name: 'Darth Vader', unitType: UnitType.CHARACTER, alignment: Alignment.DARK_SIDE, factions: ['empire', 'sith'], tags: ['attacker', 'tank'] },
      { gameId: 'GRANDMOFFTARKIN', name: 'Grand Moff Tarkin', unitType: UnitType.CHARACTER, alignment: Alignment.DARK_SIDE, factions: ['empire'], tags: ['support', 'leader'] },
      { gameId: 'THRAWN', name: 'Grand Admiral Thrawn', unitType: UnitType.CHARACTER, alignment: Alignment.DARK_SIDE, factions: ['empire'], tags: ['support', 'leader'] },
      { gameId: 'DEATHTROOPER', name: 'Death Trooper', unitType: UnitType.CHARACTER, alignment: Alignment.DARK_SIDE, factions: ['empire'], tags: ['attacker'] },

      // Rebels
      { gameId: 'COMMANDERLUKESKYWALKER', name: 'Commander Luke Skywalker', unitType: UnitType.CHARACTER, alignment: Alignment.LIGHT_SIDE, factions: ['rebel'], tags: ['attacker', 'leader'] },
      { gameId: 'PRINCESSLEIA', name: 'Princess Leia', unitType: UnitType.CHARACTER, alignment: Alignment.LIGHT_SIDE, factions: ['rebel'], tags: ['support', 'leader'] },
      { gameId: 'HANSOLO', name: 'Han Solo', unitType: UnitType.CHARACTER, alignment: Alignment.LIGHT_SIDE, factions: ['rebel', 'scoundrel'], tags: ['attacker'] },
      { gameId: 'CHEWBACCA', name: 'Chewbacca', unitType: UnitType.CHARACTER, alignment: Alignment.LIGHT_SIDE, factions: ['rebel'], tags: ['tank', 'attacker'] },
      { gameId: 'R2D2_LEGENDARY', name: 'R2-D2', unitType: UnitType.CHARACTER, alignment: Alignment.LIGHT_SIDE, factions: ['rebel', 'resistance'], tags: ['support'] },

      // Ships
      { gameId: 'CAPITALEXECUTOR', name: 'Executor', unitType: UnitType.CAPITAL_SHIP, alignment: Alignment.DARK_SIDE, factions: ['empire'], tags: ['capital_ship'] },
      { gameId: 'TIEFIGHTER', name: 'TIE Fighter Pilot', unitType: UnitType.SHIP, alignment: Alignment.DARK_SIDE, factions: ['empire'], tags: ['attacker'] }
    ]
  });
  console.log('✅ Created sample units');

  // Get created units for squad creation
  const palpatine = await prisma.unit.findUnique({ where: { gameId: 'EMPERORPALPATINE' } });
  const vader = await prisma.unit.findUnique({ where: { gameId: 'DARTHVADER' } });
  const tarkin = await prisma.unit.findUnique({ where: { gameId: 'GRANDMOFFTARKIN' } });
  const thrawn = await prisma.unit.findUnique({ where: { gameId: 'THRAWN' } });
  const deathTrooper = await prisma.unit.findUnique({ where: { gameId: 'DEATHTROOPER' } });

  const cls = await prisma.unit.findUnique({ where: { gameId: 'COMMANDERLUKESKYWALKER' } });
  const leia = await prisma.unit.findUnique({ where: { gameId: 'PRINCESSLEIA' } });
  const han = await prisma.unit.findUnique({ where: { gameId: 'HANSOLO' } });
  const chewie = await prisma.unit.findUnique({ where: { gameId: 'CHEWBACCA' } });
  const r2 = await prisma.unit.findUnique({ where: { gameId: 'R2D2_LEGENDARY' } });

  // Create sample squads
  const empireSquad = await prisma.squad.create({
    data: {
      name: 'Classic Empire',
      slug: 'classic-empire',
      description: 'Traditional Emperor Palpatine-led Empire squad',
      squadType: SquadType.REGULAR,
      strategyNotes: 'Use Palpatine leadership for TM gain and shock effects. Vader provides damage and control.',
      recommendedRelicLevel: 7,
      createdBy: admin.id,
      isPublished: true
    }
  });

  const rebelSquad = await prisma.squad.create({
    data: {
      name: 'CLS Rebels',
      slug: 'cls-rebels',
      description: 'Commander Luke Skywalker rebel team',
      squadType: SquadType.REGULAR,
      strategyNotes: 'Use CLS leadership for counter attacks and TM manipulation.',
      recommendedRelicLevel: 7,
      createdBy: admin.id,
      isPublished: true
    }
  });

  // Add units to squads
  if (palpatine && vader && tarkin && thrawn && deathTrooper) {
    await prisma.squadUnit.createMany({
      data: [
        { squadId: empireSquad.id, unitId: palpatine.id, position: 1, isLeader: true },
        { squadId: empireSquad.id, unitId: vader.id, position: 2 },
        { squadId: empireSquad.id, unitId: tarkin.id, position: 3 },
        { squadId: empireSquad.id, unitId: thrawn.id, position: 4 },
        { squadId: empireSquad.id, unitId: deathTrooper.id, position: 5 }
      ]
    });
  }

  if (cls && leia && han && chewie && r2) {
    await prisma.squadUnit.createMany({
      data: [
        { squadId: rebelSquad.id, unitId: cls.id, position: 1, isLeader: true },
        { squadId: rebelSquad.id, unitId: leia.id, position: 2 },
        { squadId: rebelSquad.id, unitId: han.id, position: 3 },
        { squadId: rebelSquad.id, unitId: chewie.id, position: 4 },
        { squadId: rebelSquad.id, unitId: r2.id, position: 5 }
      ]
    });
  }
  console.log('✅ Created sample squads');

  // Create sample missions for Mustafar
  const missions = await prisma.combatMission.createMany({
    data: [
      {
        planetId: mustafar.id,
        name: 'Mustafar Mining Facility',
        missionType: MissionType.COMBAT,
        combatType: CombatType.REGULAR,
        waveCount: 4,
        requiredFactions: ['empire'],
        territoryPoints: 12500,
        difficultyLevel: 7,
        modifiers: [
          { name: 'Thermal Damage', description: 'All characters take 5% max health damage at start of turn' },
          { name: 'Empire Advantage', description: 'Empire units gain 25% Critical Chance' }
        ]
      },
      {
        planetId: mustafar.id,
        name: 'Lava River Crossing',
        missionType: MissionType.COMBAT,
        combatType: CombatType.REGULAR,
        waveCount: 3,
        requiredFactions: ['empire'],
        territoryPoints: 10000,
        difficultyLevel: 6,
        modifiers: [
          { name: 'Burning Ground', description: 'Characters without immunity take damage over time' }
        ]
      },
      {
        planetId: mustafar.id,
        name: 'Vader\'s Castle Approach',
        missionType: MissionType.SPECIAL,
        combatType: CombatType.REGULAR,
        waveCount: 5,
        requiredFactions: ['sith'],
        territoryPoints: 15000,
        difficultyLevel: 8
      },
      {
        planetId: mustafar.id,
        name: 'Imperial Fleet Deployment',
        missionType: MissionType.FLEET,
        combatType: CombatType.FLEET,
        waveCount: 3,
        requiredFactions: ['empire'],
        unitCount: 7,
        territoryPoints: 18000,
        difficultyLevel: 7
      }
    ]
  });
  console.log('✅ Created sample missions');

  // Get first mission for recommendations
  const firstMission = await prisma.combatMission.findFirst({
    where: { planetId: mustafar.id }
  });

  if (firstMission) {
    // Create mission recommendations
    await prisma.missionSquadRecommendation.createMany({
      data: [
        {
          missionId: firstMission.id,
          squadId: empireSquad.id,
          priority: 1,
          successRate: 85.5,
          difficultyRating: 3,
          submittedBy: admin.id,
          approvedBy: admin.id,
          approvedAt: new Date()
        },
        {
          missionId: firstMission.id,
          squadId: rebelSquad.id,
          priority: 2,
          successRate: 72.3,
          difficultyRating: 4,
          submittedBy: admin.id,
          approvedBy: admin.id,
          approvedAt: new Date()
        }
      ]
    });

    // Create sample wave data
    await prisma.missionWave.createMany({
      data: [
        {
          missionId: firstMission.id,
          waveNumber: 1,
          enemies: [
            { name: 'Mustafar Security', level: 85, gear: 12, abilities: ['Basic Attack', 'Thermal Blast'] },
            { name: 'Mining Droid', level: 85, gear: 11, abilities: ['Drill Attack', 'Shield Generator'] }
          ],
          specialMechanics: ['Thermal damage increases each turn'],
          turnMeterPreload: 0
        },
        {
          missionId: firstMission.id,
          waveNumber: 2,
          enemies: [
            { name: 'Elite Security Captain', level: 85, gear: 13, abilities: ['Leadership', 'Coordinated Strike', 'Emergency Protocol'] },
            { name: 'Heavy Mining Droid', level: 85, gear: 12, abilities: ['Heavy Blast', 'Repair Protocol'] }
          ],
          specialMechanics: ['Captain buffs all allies when below 50% health'],
          turnMeterPreload: 15
        }
      ]
    });

    // Create sample strategy video
    await prisma.strategyVideo.create({
      data: {
        missionId: firstMission.id,
        squadId: empireSquad.id,
        title: 'Mustafar Mining Facility - Classic Empire Strategy',
        description: 'Step-by-step guide using Emperor Palpatine lead Empire team',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        platform: Platform.YOUTUBE,
        durationSeconds: 480,
        creatorName: 'SWGOH Master',
        creatorChannelUrl: 'https://www.youtube.com/channel/example',
        submittedBy: admin.id,
        approvedBy: admin.id,
        isFeatured: true
      }
    });
  }
  console.log('✅ Created sample recommendations, waves, and videos');

  // Create sample missions for other planets
  await prisma.combatMission.createMany({
    data: [
      // Corellia missions
      {
        planetId: corellia.id,
        name: 'Corellia Shipyards',
        missionType: MissionType.COMBAT,
        combatType: CombatType.REGULAR,
        waveCount: 3,
        requiredFactions: ['empire', 'rebel'],
        territoryPoints: 11000,
        difficultyLevel: 6
      },
      {
        planetId: corellia.id,
        name: 'Coronet City Siege',
        missionType: MissionType.SPECIAL,
        combatType: CombatType.REGULAR,
        waveCount: 4,
        requiredFactions: ['rebel'],
        territoryPoints: 14000,
        difficultyLevel: 7
      },
      // Coruscant missions
      {
        planetId: coruscant.id,
        name: 'Senate Building Assault',
        missionType: MissionType.COMBAT,
        combatType: CombatType.REGULAR,
        waveCount: 5,
        requiredFactions: ['rebel', 'jedi'],
        territoryPoints: 16000,
        difficultyLevel: 8
      },
      {
        planetId: coruscant.id,
        name: 'Temple District',
        missionType: MissionType.SPECIAL,
        combatType: CombatType.REGULAR,
        waveCount: 3,
        requiredFactions: ['jedi'],
        territoryPoints: 13000,
        difficultyLevel: 7
      }
    ]
  });
  console.log('✅ Created additional missions');

  console.log('🎉 Database seed completed successfully!');
  console.log('📧 Admin login: admin@example.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });