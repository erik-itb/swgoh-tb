/**
 * Rise of the Empire Territory Battle Static Data
 * Phase and Planet definitions with detailed mission data
 */

export interface Mission {
  number: number;
  type: "fleet" | "combat" | "special";
  label?: string; // Optional custom label like "Third Sister Special Mission"
  iconType?: "third-sister" | "special-1" | "special-2"; // Special mission icon variant
}

export interface Planet {
  id: string;
  name: string;
  alignment: "dark" | "light" | "mixed";
  missions: Mission[];
  description?: string;
}

export interface Phase {
  number: number;
  name: string;
  planets: string[];
}

export const PHASES: Phase[] = [
  { number: 1, name: "Phase 1", planets: ["mustafar", "corellia", "coruscant"] },
  { number: 2, name: "Phase 2", planets: ["geonosis", "felucia", "bracca"] },
  { number: 3, name: "Phase 3", planets: ["dathomir", "tatooine", "kashyyyk", "zeffo"] },
  { number: 4, name: "Phase 4", planets: ["medstation", "kessel", "lothal", "mandalore"] },
  { number: 5, name: "Phase 5", planets: ["malachor", "vandor", "kafrene"] },
  { number: 6, name: "Phase 6", planets: ["deathstar", "hoth", "scarif"] }
];

export const PLANETS: Record<string, Planet> = {
  // Phase 1
  mustafar: {
    id: "mustafar",
    name: "Mustafar",
    alignment: "dark",
    description: "Dark Side - Empire, First Order, Sith, Inquisitors",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "combat" }
    ]
  },
  corellia: {
    id: "corellia",
    name: "Corellia",
    alignment: "mixed",
    description: "Neutral - Bounty Hunters, Smugglers, Scoundrels",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "special", iconType: "special-2" }
    ]
  },
  coruscant: {
    id: "coruscant",
    name: "Coruscant",
    alignment: "light",
    description: "Light Side - Jedi, Galactic Republic",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" }
    ]
  },
  
  // Phase 2
  geonosis: {
    id: "geonosis",
    name: "Geonosis",
    alignment: "dark",
    description: "Dark Side - Separatists, Geonosians",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "combat" }
    ]
  },
  felucia: {
    id: "felucia",
    name: "Felucia",
    alignment: "mixed",
    description: "Light Side - Heal Over Time modifier",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "combat" }
    ]
  },
  bracca: {
    id: "bracca",
    name: "Bracca",
    alignment: "light",
    description: "Light Side - Jedi, Rebels",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "special", iconType: "special-2" }
    ]
  },
  
  // Phase 3
  dathomir: {
    id: "dathomir",
    name: "Dathomir",
    alignment: "dark",
    description: "Dark Side - Sith, Nightsisters",
    missions: [
      { number: 1, type: "combat" },
      { number: 2, type: "combat" }, // 2x2 - appears twice on map
      { number: 3, type: "combat" },
      { number: 4, type: "special", iconType: "special-1" }
    ]
  },
  tatooine: {
    id: "tatooine",
    name: "Tatooine",
    alignment: "mixed",
    description: "Neutral - Bounty Hunters, Tusken, Hutt Cartel",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "special", label: "Third Sister Special Mission", iconType: "third-sister" },
      { number: 4, type: "special", iconType: "special-2" },
      { number: 5, type: "combat" },
      { number: 6, type: "combat" }
    ]
  },
  kashyyyk: {
    id: "kashyyyk",
    name: "Kashyyyk",
    alignment: "light",
    description: "Light Side - Wookiees, Rebels",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "special", iconType: "special-1" },
      { number: 5, type: "combat" }
    ]
  },
  zeffo: {
    id: "zeffo",
    name: "Zeffo",
    alignment: "light",
    description: "Bonus Zone - Jedi Survivor",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "special", iconType: "special-1" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "combat" }
    ]
  },
  
  // Phase 4
  medstation: {
    id: "medstation",
    name: "Medical Station",
    alignment: "dark",
    description: "Light Side - Rebels, Resistance",
    missions: [
      { number: 1, type: "special", iconType: "special-2" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" } // 3x3 - appears 3 times on map
    ]
  },
  kessel: {
    id: "kessel",
    name: "Kessel",
    alignment: "mixed",
    description: "Bonus Zone",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" }, // 3x2 - appears twice on map
      { number: 4, type: "special", iconType: "special-2" }
    ]
  },
  lothal: {
    id: "lothal",
    name: "Lothal",
    alignment: "light",
    description: "Light Side - Spectres, Rebels",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" }
    ]
  },
  mandalore: {
    id: "mandalore",
    name: "Mandalore",
    alignment: "mixed",
    description: "Bonus Zone - Mandalorians",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" }
    ]
  },
  
  // Phase 5
  malachor: {
    id: "malachor",
    name: "Malachor",
    alignment: "dark",
    description: "Dark Side - Sith, Inquisitors",
    missions: [
      { number: 1, type: "combat" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" }
    ]
  },
  vandor: {
    id: "vandor",
    name: "Vandor",
    alignment: "mixed",
    description: "Neutral - Scoundrels",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "special", iconType: "special-2" }
    ]
  },
  kafrene: {
    id: "kafrene",
    name: "Ring of Kafrene",
    alignment: "light",
    description: "Bonus Zone",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "combat" }
    ]
  },
  
  // Phase 6
  deathstar: {
    id: "deathstar",
    name: "Death Star",
    alignment: "dark",
    description: "Mixed - Empire, Rebels",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" } // 4x2 - appears twice on map
    ]
  },
  hoth: {
    id: "hoth",
    name: "Hoth",
    alignment: "mixed",
    description: "Light Side - Rebels, Resistance",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" },
      { number: 5, type: "combat" }
    ]
  },
  scarif: {
    id: "scarif",
    name: "Scarif",
    alignment: "light",
    description: "Mixed - Rogue One, Empire",
    missions: [
      { number: 1, type: "fleet" },
      { number: 2, type: "combat" },
      { number: 3, type: "combat" },
      { number: 4, type: "combat" } // 4x2 - appears twice on map
    ]
  }
};

export function getPlanetsByPhase(phaseNumber: number): Planet[] {
  const phase = PHASES.find(p => p.number === phaseNumber);
  if (!phase) return [];
  return phase.planets.map(id => PLANETS[id]).filter(Boolean);
}

export function getPhaseForPlanet(planetId: string): Phase | undefined {
  return PHASES.find(phase => phase.planets.includes(planetId));
}
