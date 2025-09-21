import { PrismaClient, UserRole, SquadType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users
  console.log('👥 Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('password', 12),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const contributorUser = await prisma.user.create({
    data: {
      username: 'contributor',
      email: 'contributor@example.com',
      passwordHash: await bcrypt.hash('password', 12),
      role: UserRole.CONTRIBUTOR,
      isActive: true,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      username: 'viewer',
      email: 'viewer@example.com',
      passwordHash: await bcrypt.hash('password', 12),
      role: UserRole.VIEWER,
      isActive: true,
    },
  });

  // Create Rise of the Empire Territory Battle
  console.log('🏛️ Creating Rise of the Empire Territory Battle...');
  const riseOfEmpire = await prisma.territoryBattle.create({
    data: {
      name: 'Rise of the Empire',
      slug: 'rise-of-the-empire',
      description: 'Galactic Republic vs Separatists Territory Battle featuring iconic Clone Wars battles across multiple planets.',
      faction: 'GALACTIC_REPUBLIC',
      totalPhases: 6,
      totalMissions: 54,
      totalSquads: 0, // Will be calculated after squad creation
      maxStars: 162,
      isActive: true,
    },
  });

  // Create Phases for Rise of the Empire
  console.log('🚀 Creating phases...');
  const phases = [];
  for (let i = 1; i <= 6; i++) {
    const phase = await prisma.phase.create({
      data: {
        territoryBattleId: riseOfEmpire.id,
        phaseNumber: i,
        name: `Phase ${i}`,
        description: getPhaseDescription(i),
        totalPlanets: 3,
        totalMissions: 9,
        minRelicLevel: getMinRelicLevel(i),
        territoryPoints: getPhaseTP(i),
        unlockRequirements: getPhaseUnlockRequirements(i),
      },
    });
    phases.push(phase);
  }

  // Create Planets and Missions for each Phase
  console.log('🪐 Creating planets and missions...');
  const planetNames = [
    'Geonosis', 'Kamino', 'Ryloth',
    'Coruscant', 'Christophsis', 'Naboo',
    'Kashyyyk', 'Felucia', 'Mygeeto',
    'Utapau', 'Saleucami', 'Cato Neimoidia',
    'Mustafar', 'Polis Massa', 'Dagobah',
    'Tatooine', 'Alderaan', 'Yavin 4'
  ];

  const missions = [];
  let planetIndex = 0;

  for (const phase of phases) {
    for (let p = 0; p < 3; p++) {
      const planet = await prisma.planet.create({
        data: {
          phaseId: phase.id,
          name: planetNames[planetIndex],
          planetType: getPlanetType(planetNames[planetIndex]),
          description: getPlanetDescription(planetNames[planetIndex]),
          difficulty: getPlanetDifficulty(phase.phaseNumber),
          totalCombatMissions: 2,
          totalSpecialMissions: 1,
          maxStars: 9,
          territoryPoints: getPlanetTP(phase.phaseNumber),
          strategyTips: getPlanetStrategyTips(planetNames[planetIndex]),
        },
      });

      // Create Combat Missions
      for (let m = 1; m <= 2; m++) {
        const mission = await prisma.combatMission.create({
          data: {
            planetId: planet.id,
            name: `${planet.name} Combat ${m}`,
            description: `Engage Separatist forces on ${planet.name} in strategic combat operation ${m}.`,
            missionType: 'combat',
            difficulty: getMissionDifficulty(phase.phaseNumber, m),
            waveNumber: m,
            maxStars: 3,
            territoryPoints: getMissionTP(phase.phaseNumber, 'combat'),
            attempts: 1,
            enemyDescription: getEnemyDescription(planet.name, m),
            modifiers: getMissionModifiers(phase.phaseNumber),
            strategyVideoUrl: null,
            waveBreakdown: getWaveBreakdown(planet.name, m),
          },
        });
        missions.push(mission);
      }

      // Create Special Mission
      const specialMission = await prisma.combatMission.create({
        data: {
          planetId: planet.id,
          name: `${planet.name} Special Mission`,
          description: `Complete special objectives on ${planet.name} with specific squad requirements.`,
          missionType: 'special',
          difficulty: getMissionDifficulty(phase.phaseNumber, 3),
          waveNumber: 3,
          maxStars: 3,
          territoryPoints: getMissionTP(phase.phaseNumber, 'special'),
          attempts: 1,
          enemyDescription: getSpecialEnemyDescription(planet.name),
          modifiers: getSpecialMissionModifiers(phase.phaseNumber),
          strategyVideoUrl: getStrategyVideoUrl(planet.name),
          waveBreakdown: getSpecialWaveBreakdown(planet.name),
        },
      });
      missions.push(specialMission);

      planetIndex++;
    }
  }

  // Create sample squads
  console.log('⭐ Creating sample squads...');
  const squads = await createSampleSquads(contributorUser.id, adminUser.id, missions);

  // Update Territory Battle squad count
  await prisma.territoryBattle.update({
    where: { id: riseOfEmpire.id },
    data: { totalSquads: squads.length },
  });

  // Create mission recommendations
  console.log('🎯 Creating mission recommendations...');
  await createMissionRecommendations(squads, missions);

  console.log('✅ Database seeding completed successfully!');
  console.log(`Created:
  - ${3} users (admin, contributor, viewer)
  - 1 Territory Battle (Rise of the Empire)
  - ${phases.length} phases
  - ${planetIndex} planets
  - ${missions.length} missions
  - ${squads.length} squads`);
}

// Helper functions for generating realistic data
function getPhaseDescription(phase: number): string {
  const descriptions = [
    'Opening assault on Separatist strongholds with basic Republic forces.',
    'Reinforced attacks with Clone Trooper battalions and Jedi support.',
    'Major offensive operations with specialized units and heavy artillery.',
    'Elite assault missions requiring veteran Clone commanders and Jedi Masters.',
    'Critical operations with Arc Troopers and elite Republic special forces.',
    'Final assault with the most powerful Republic forces and legendary Jedi.',
  ];
  return descriptions[phase - 1];
}

function getMinRelicLevel(phase: number): number {
  return Math.min(phase + 2, 9);
}

function getPhaseTP(phase: number): number {
  return phase * 15000;
}

function getPhaseUnlockRequirements(phase: number): string | null {
  if (phase === 1) return null;
  return `Complete ${phase - 1} star${phase - 1 > 1 ? 's' : ''} in Phase ${phase - 1}`;
}

function getPlanetType(name: string): string {
  const types: Record<string, string> = {
    'Geonosis': 'desert',
    'Kamino': 'ocean',
    'Ryloth': 'volcanic',
    'Coruscant': 'urban',
    'Christophsis': 'crystalline',
    'Naboo': 'temperate',
    'Kashyyyk': 'forest',
    'Felucia': 'jungle',
    'Mygeeto': 'ice',
    'Utapau': 'canyon',
    'Saleucami': 'desert',
    'Cato Neimoidia': 'bridge-city',
    'Mustafar': 'volcanic',
    'Polis Massa': 'asteroid',
    'Dagobah': 'swamp',
    'Tatooine': 'desert',
    'Alderaan': 'temperate',
    'Yavin 4': 'jungle',
  };
  return types[name] || 'temperate';
}

function getPlanetDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'Geonosis': 'Desert world and stronghold of the Separatist droid army.',
    'Kamino': 'Ocean world, home to the clone manufacturing facilities.',
    'Ryloth': 'Homeworld of the Twi\'leks, contested by Separatist forces.',
    'Coruscant': 'Republic capital, under siege from Separatist infiltrators.',
    'Christophsis': 'Crystal planet with strategic importance to both sides.',
    'Naboo': 'Peaceful world threatened by renewed Separatist invasion.',
    'Kashyyyk': 'Wookiee homeworld, site of major Clone Wars battles.',
    'Felucia': 'Jungle world with dangerous flora and Separatist presence.',
    'Mygeeto': 'Ice world with valuable crystal deposits.',
    'Utapau': 'Sinkhole planet where General Grievous was defeated.',
    'Saleucami': 'Desert world with hidden Separatist facilities.',
    'Cato Neimoidia': 'Trade Federation stronghold with bridge cities.',
    'Mustafar': 'Volcanic world, site of the final duel.',
    'Polis Massa': 'Asteroid field with hidden research facilities.',
    'Dagobah': 'Mysterious swamp world with Force significance.',
    'Tatooine': 'Desert world on the Outer Rim.',
    'Alderaan': 'Peaceful world known for its diplomacy.',
    'Yavin 4': 'Jungle moon with ancient temples.',
  };
  return descriptions[name] || `Strategic location in the Clone Wars conflict.`;
}

function getPlanetDifficulty(phase: number): string {
  if (phase <= 2) return 'easy';
  if (phase <= 4) return 'medium';
  if (phase <= 5) return 'hard';
  return 'extreme';
}

function getPlanetTP(phase: number): number {
  return phase * 5000;
}

function getPlanetStrategyTips(name: string): string {
  const tips: Record<string, string> = {
    'Geonosis': 'Focus on anti-droid tactics and area-of-effect abilities.',
    'Kamino': 'Utilize Clone synergies and weather resistance.',
    'Ryloth': 'Prepare for hit-and-run tactics and guerrilla warfare.',
    'Coruscant': 'Urban combat requires crowd control and precision strikes.',
    'Christophsis': 'Crystal formations provide cover but limit movement.',
    'Naboo': 'Underwater sections require specialized breathing equipment.',
    'Kashyyyk': 'Dense forests favor stealth and long-range combat.',
    'Felucia': 'Toxic environment requires environmental protection.',
    'Mygeeto': 'Extreme cold affects equipment and troop performance.',
    'Utapau': 'Vertical combat in sinkholes requires climbing gear.',
    'Saleucami': 'Desert conditions cause equipment overheating.',
    'Cato Neimoidia': 'High-altitude combat on narrow bridge platforms.',
    'Mustafar': 'Extreme heat and lava flows limit positioning.',
    'Polis Massa': 'Zero gravity combat requires specialized training.',
    'Dagobah': 'Swamp conditions slow movement and obscure vision.',
    'Tatooine': 'Twin suns cause equipment overheating and fatigue.',
    'Alderaan': 'Mountain terrain favors defensive positions.',
    'Yavin 4': 'Dense jungle canopy limits air support.',
  };
  return tips[name] || 'Standard tactical considerations apply.';
}

function getMissionDifficulty(phase: number, mission: number): string {
  const base = phase <= 2 ? 0 : phase <= 4 ? 1 : phase <= 5 ? 2 : 3;
  const modifier = mission === 3 ? 1 : 0; // Special missions are harder
  const total = base + modifier;

  if (total <= 1) return 'easy';
  if (total <= 2) return 'medium';
  if (total <= 3) return 'hard';
  return 'extreme';
}

function getMissionTP(phase: number, type: string): number {
  const base = phase * 1500;
  return type === 'special' ? base * 1.5 : base;
}

function getEnemyDescription(planet: string, mission: number): string {
  const enemies = [
    `Standard Separatist battle droids with tactical droid commanders on ${planet}.`,
    `Elite droid forces including super battle droids and droidekas on ${planet}.`,
  ];
  return enemies[mission - 1] || enemies[0];
}

function getSpecialEnemyDescription(planet: string): string {
  return `Specialized Separatist forces with unique tactical advantages on ${planet}.`;
}

function getMissionModifiers(phase: number): string[] {
  const modifiers = [
    ['Droid Efficiency: +25% droid damage'],
    ['Tactical Advantage: Enemy gains bonus turn meter'],
    ['Separatist Coordination: Enemies share status effects', 'Enhanced Shields: +50% protection'],
    ['Battle Hardened: Enemies resist debuffs', 'Droid Network: Shared cooldown reduction'],
    ['Elite Forces: +100% health and protection', 'Synchronized Assault: Enemies attack together'],
    ['Final Stand: Enrage timer at 50% health', 'Overwhelming Force: Massive stat bonuses'],
  ];
  return modifiers[Math.min(phase - 1, modifiers.length - 1)] || [];
}

function getSpecialMissionModifiers(phase: number): string[] {
  const base = getMissionModifiers(phase);
  return [...base, 'Special Objectives: Additional victory conditions'];
}

function getStrategyVideoUrl(planet: string): string | null {
  // Some planets have strategy videos
  const withVideos = ['Geonosis', 'Kamino', 'Coruscant', 'Kashyyyk', 'Mustafar'];
  if (withVideos.includes(planet)) {
    return `https://youtube.com/watch?v=${planet.toLowerCase()}_strategy`;
  }
  return null;
}

function getWaveBreakdown(planet: string, mission: number) {
  return [
    {
      waveNumber: 1,
      title: 'Initial Assault',
      description: `First wave of Separatist forces on ${planet}`,
      enemies: [
        {
          name: 'B1 Battle Droid',
          type: 'damage',
          health: 50000 * mission,
          abilities: ['Basic Attack', 'Suppressive Fire'],
          weaknesses: ['Ion damage', 'Daze effects'],
          threats: ['High numbers', 'Coordinated fire']
        },
        {
          name: 'B2 Super Battle Droid',
          type: 'tank',
          health: 100000 * mission,
          protection: 75000 * mission,
          abilities: ['Rocket Launcher', 'Defensive Matrix'],
          weaknesses: ['Armor penetration', 'Thermal detonators'],
          threats: ['Heavy armor', 'Area damage']
        }
      ],
      strategy: 'Focus fire on B2s first, use AoE abilities against B1 groups'
    }
  ];
}

function getSpecialWaveBreakdown(planet: string) {
  return [
    {
      waveNumber: 1,
      title: 'Special Forces',
      description: `Elite Separatist units defending ${planet}`,
      enemies: [
        {
          name: 'Magna Guard',
          type: 'damage',
          health: 150000,
          abilities: ['Electrostaff Strike', 'Self-Destruct'],
          weaknesses: ['Stuns', 'High damage abilities'],
          threats: ['Self-destruct on death', 'High damage output']
        },
        {
          name: 'Tactical Droid',
          type: 'support',
          health: 100000,
          abilities: ['Battle Coordination', 'Shield Generator'],
          weaknesses: ['Ability block', 'Isolate effects'],
          threats: ['Team buffs', 'Strategic coordination']
        }
      ],
      strategy: 'Eliminate Tactical Droid first to disrupt enemy coordination'
    }
  ];
}

async function createSampleSquads(contributorId: number, adminId: number, missions: any[]) {
  const squads = [];

  // Clone Troopers Squad
  const cloneTroopersSquad = await prisma.squad.create({
    data: {
      name: '501st Clone Troopers',
      description: 'Elite clone trooper squad led by Rex, specializing in coordinated attacks and tactical superiority.',
      squadType: SquadType.CLONE_TROOPERS,
      strategyNotes: `Turn order: Rex → Fives → Echo → Arc Trooper → Clone Sergeant

Key Strategy:
1. Rex uses "Subdue" to apply leadership buff
2. Fives uses "Tactical Awareness" for team assist
3. Focus fire priority targets with coordinated attacks
4. Use Echo's "EMP Grenade" against droid enemies
5. Save Arc Trooper special for high-value targets

Gear Priority: Rex (Leader) > Fives > Echo > Arc Trooper > Clone Sergeant`,
      strategyVideoUrl: 'https://youtube.com/watch?v=clone_troopers_guide',
      isPublished: true,
      createdBy: contributorId,
      averageRating: 4.7,
      successRate: 85,
      units: {
        create: [
          {
            name: 'Clone Commander Rex',
            position: 'leader',
            requiredStars: 7,
            requiredGearLevel: 13,
            requiredRelicLevel: 7,
            requiredZetas: 2,
            requiredOmicrons: 1,
            notes: 'Leadership zeta essential for team coordination. Omicron provides massive Territory Battle bonuses.',
            alternativeUnits: ['Clone Commander Cody', 'Clone Sergeant']
          },
          {
            name: 'ARC Trooper Fives',
            position: 'damage',
            requiredStars: 7,
            requiredGearLevel: 13,
            requiredRelicLevel: 5,
            requiredZetas: 1,
            notes: 'Unique zeta for sacrifice mechanic. High speed and critical chance mods recommended.',
            alternativeUnits: ['Clone Trooper Echo', 'ARC Trooper']
          },
          {
            name: 'Clone Trooper Echo',
            position: 'support',
            requiredStars: 7,
            requiredGearLevel: 13,
            requiredRelicLevel: 5,
            requiredZetas: 0,
            notes: 'Focus on potency for dispels and debuffs. Works well with high-speed builds.',
            alternativeUnits: ['Clone Medic', 'Heavy Clone Trooper']
          },
          {
            name: 'ARC Trooper',
            position: 'damage',
            requiredStars: 7,
            requiredGearLevel: 12,
            requiredRelicLevel: 3,
            requiredZetas: 0,
            notes: 'Secondary damage dealer. Mod for critical damage and offense.',
            alternativeUnits: ['Clone Heavy Gunner', 'Clone Sharpshooter']
          },
          {
            name: 'Clone Sergeant',
            position: 'tank',
            requiredStars: 7,
            requiredGearLevel: 12,
            requiredRelicLevel: 3,
            requiredZetas: 0,
            notes: 'Tank role with taunt capabilities. Focus on health and protection mods.',
            alternativeUnits: ['Heavy Clone Trooper', 'Clone Medic']
          }
        ]
      }
    }
  });

  // Jedi Squad
  const jediSquad = await prisma.squad.create({
    data: {
      name: 'Jedi Master Council',
      description: 'Powerful Jedi masters utilizing Force abilities and lightsaber combat for overwhelming battlefield control.',
      squadType: SquadType.JEDI,
      strategyNotes: `Turn order: Yoda → Windu → Kenobi → Ahsoka → Kanan

Key Strategy:
1. Yoda opens with "Battle Meditation" for team buffs
2. Mace Windu uses "Vaapad" for offense up and expose
3. Kenobi provides defense and counterattacks
4. Focus on ability rotation to maintain buffs
5. Use Force abilities to control enemy turn meter

Gear Priority: Yoda > Mace Windu > Obi-Wan > Ahsoka > Kanan`,
      isPublished: true,
      createdBy: adminId,
      averageRating: 4.5,
      successRate: 78,
      units: {
        create: [
          {
            name: 'Grand Master Yoda',
            position: 'leader',
            requiredStars: 7,
            requiredGearLevel: 13,
            requiredRelicLevel: 8,
            requiredZetas: 2,
            notes: 'Both leadership and unique zetas recommended. High speed for opening buffs.',
            alternativeUnits: ['Jedi Knight Luke Skywalker', 'Hermit Yoda']
          },
          {
            name: 'Mace Windu',
            position: 'damage',
            requiredStars: 7,
            requiredGearLevel: 13,
            requiredRelicLevel: 7,
            requiredZetas: 1,
            notes: 'Unique zeta for Vaapad synergy. Focus on offense and critical chance.',
            alternativeUnits: ['Jedi Knight Anakin', 'Aayla Secura']
          },
          {
            name: 'Obi-Wan Kenobi (Old Ben)',
            position: 'tank',
            requiredStars: 7,
            requiredGearLevel: 12,
            requiredRelicLevel: 5,
            requiredZetas: 1,
            notes: 'Unique zeta for sacrifice ability. High health and protection build.',
            alternativeUnits: ['General Kenobi', 'Qui-Gon Jinn']
          },
          {
            name: 'Ahsoka Tano',
            position: 'damage',
            requiredStars: 7,
            requiredGearLevel: 12,
            requiredRelicLevel: 5,
            requiredZetas: 0,
            notes: 'Fast attacker with good synergy. Speed and offense mods.',
            alternativeUnits: ['Ezra Bridger', 'Kit Fisto']
          },
          {
            name: 'Kanan Jarrus',
            position: 'support',
            requiredStars: 7,
            requiredGearLevel: 12,
            requiredRelicLevel: 3,
            requiredZetas: 0,
            notes: 'Support role with buffs and healing. Balanced mod setup.',
            alternativeUnits: ['Luminara Unduli', 'Barriss Offee']
          }
        ]
      }
    }
  });

  // Separatist Droids Squad
  const separatistSquad = await prisma.squad.create({
    data: {
      name: 'Separatist Droid Army',
      description: 'Coordinated droid forces with tactical leadership and overwhelming numbers.',
      squadType: SquadType.SEPARATISTS,
      strategyNotes: `Turn order: Grievous → Magna Guard → B2 → B1 → Tactical Droid

Key Strategy:
1. General Grievous leads with "Sinister Laugh"
2. Focus on droid synergies and mass attacks
3. Use B2 as tank with defensive protocols
4. Coordinate attacks with Tactical Droid buffs
5. Grievous finisher abilities for high damage

Gear Priority: General Grievous > Magna Guard > B2 > B1 > Tactical Droid`,
      isPublished: true,
      createdBy: contributorId,
      averageRating: 4.2,
      successRate: 72,
      units: {
        create: [
          {
            name: 'General Grievous',
            position: 'leader',
            requiredStars: 7,
            requiredGearLevel: 13,
            requiredRelicLevel: 7,
            requiredZetas: 2,
            notes: 'Leadership and unique zetas for maximum effectiveness. High offense build.',
            alternativeUnits: ['Count Dooku', 'Asajj Ventress']
          },
          {
            name: 'Magna Guard',
            position: 'tank',
            requiredStars: 7,
            requiredGearLevel: 13,
            requiredRelicLevel: 5,
            requiredZetas: 0,
            notes: 'Primary tank with self-destruct capability. Health and protection focus.',
            alternativeUnits: ['B2 Super Battle Droid', 'Droideka']
          },
          {
            name: 'B2 Super Battle Droid',
            position: 'tank',
            requiredStars: 7,
            requiredGearLevel: 12,
            requiredRelicLevel: 3,
            requiredZetas: 0,
            notes: 'Secondary tank with AoE capabilities. Balanced defensive build.',
            alternativeUnits: ['Droideka', 'Vulture Droid']
          },
          {
            name: 'B1 Battle Droid',
            position: 'damage',
            requiredStars: 7,
            requiredGearLevel: 12,
            requiredRelicLevel: 3,
            requiredZetas: 0,
            notes: 'Numbers advantage with stack mechanics. Speed and offense mods.',
            alternativeUnits: ['Commando Droid', 'Probe Droid']
          },
          {
            name: 'Tactical Droid',
            position: 'support',
            requiredStars: 6,
            requiredGearLevel: 11,
            requiredRelicLevel: 0,
            requiredZetas: 0,
            notes: 'Support role for coordination. Potency and speed focus.',
            alternativeUnits: ['T-Series Tactical Droid', 'Probe Droid']
          }
        ]
      }
    }
  });

  squads.push(cloneTroopersSquad, jediSquad, separatistSquad);

  // Create additional squads for variety
  const additionalSquads = [
    {
      name: 'Galactic Republic Fleet',
      squadType: SquadType.GALACTIC_REPUBLIC,
      description: 'Republic naval forces with coordinated ship tactics.',
      createdBy: contributorId,
      rating: 4.1,
      success: 68
    },
    {
      name: 'Mandalorian Warriors',
      squadType: SquadType.MANDALORIANS,
      description: 'Elite Mandalorian fighters with beskar armor and advanced weapons.',
      createdBy: adminId,
      rating: 4.6,
      success: 82
    },
    {
      name: 'Sith Triumvirate',
      squadType: SquadType.SITH,
      description: 'Powerful Sith lords wielding the dark side of the Force.',
      createdBy: contributorId,
      rating: 4.8,
      success: 88
    }
  ];

  for (const squadData of additionalSquads) {
    const squad = await prisma.squad.create({
      data: {
        name: squadData.name,
        description: squadData.description,
        squadType: squadData.squadType,
        strategyNotes: 'Advanced tactical coordination required. See video guide for details.',
        isPublished: true,
        createdBy: squadData.createdBy,
        averageRating: squadData.rating,
        successRate: squadData.success,
      }
    });
    squads.push(squad);
  }

  return squads;
}

async function createMissionRecommendations(squads: any[], missions: any[]) {
  // Create mission recommendations linking squads to appropriate missions
  for (let i = 0; i < squads.length && i < missions.length; i++) {
    const mission = missions[i % missions.length];
    const squad = squads[i % squads.length];

    await prisma.missionRecommendation.create({
      data: {
        missionId: mission.id,
        squadId: squad.id,
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        notes: `Recommended for ${mission.difficulty} difficulty missions. Proven effective against ${mission.missionType} scenarios.`,
        version: '1.0',
      }
    });
  }

  // Create additional cross-references
  const priorities = ['high', 'medium', 'low'];
  for (let i = 0; i < 10; i++) {
    const mission = missions[Math.floor(Math.random() * missions.length)];
    const squad = squads[Math.floor(Math.random() * squads.length)];

    // Check if recommendation already exists
    const existing = await prisma.missionRecommendation.findFirst({
      where: {
        missionId: mission.id,
        squadId: squad.id,
      }
    });

    if (!existing) {
      await prisma.missionRecommendation.create({
        data: {
          missionId: mission.id,
          squadId: squad.id,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          successRate: Math.floor(Math.random() * 30) + 70, // 70-100%
          notes: `Alternative recommendation for tactical variety. ${Math.random() > 0.5 ? 'Requires specific modding strategy.' : 'Standard gear requirements apply.'}`,
          version: '1.0',
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });