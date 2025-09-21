// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export enum UserRole {
  VIEWER = 'VIEWER',
  CONTRIBUTOR = 'CONTRIBUTOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Auth Types
export interface AuthData {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Territory Battle Types
export interface TerritoryBattle {
  id: number;
  name: string;
  slug: string;
  description?: string;
  totalPhases: number;
  isActive: boolean;
  createdAt: string;
  phases: Phase[];
}

export interface Phase {
  id: number;
  territoryBattleId: number;
  phaseNumber: number;
  name?: string;
  relicRequirement?: string;
  startGpRequirement?: bigint;
  createdAt: string;
  territoryBattle?: TerritoryBattle;
  planets: Planet[];
}

export interface Planet {
  id: number;
  phaseId: number;
  name: string;
  slug: string;
  alignment: Alignment;
  isBonusPlanet: boolean;
  unlockRequirement?: string;
  starRequirements: Record<string, number>;
  backgroundImageUrl?: string;
  iconUrl?: string;
  createdAt: string;
  phase?: Phase;
  missions: CombatMission[];
  _count?: {
    missions: number;
  };
}

export enum Alignment {
  DARK_SIDE = 'DARK_SIDE',
  LIGHT_SIDE = 'LIGHT_SIDE',
  MIXED = 'MIXED',
}

// Mission Types
export interface CombatMission {
  id: number;
  planetId: number;
  name: string;
  missionType?: MissionType;
  combatType?: CombatType;
  waveCount: number;
  requiredUnits: any[];
  requiredFactions: string[];
  unitCount: number;
  modifiers: any[];
  rewards: any;
  territoryPoints?: number;
  difficultyLevel?: number;
  createdAt: string;
  updatedAt: string;
  planet?: Planet;
  recommendations?: MissionSquadRecommendation[];
  waves?: MissionWave[];
  videos?: StrategyVideo[];
  _count?: {
    recommendations: number;
    videos: number;
    waves: number;
  };
}

export enum MissionType {
  COMBAT = 'COMBAT',
  SPECIAL = 'SPECIAL',
  FLEET = 'FLEET',
  OPERATIONS = 'OPERATIONS',
}

export enum CombatType {
  REGULAR = 'REGULAR',
  FLEET = 'FLEET',
}

// Squad Types
export interface Squad {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  squadType?: SquadType;
  strategyNotes?: string;
  minPowerRequirement?: number;
  recommendedGearTier?: number;
  recommendedRelicLevel?: number;
  createdBy?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    username: string;
  };
  units: SquadUnit[];
  recommendations?: MissionSquadRecommendation[];
  videos?: StrategyVideo[];
  _count?: {
    recommendations: number;
  };
}

export enum SquadType {
  REGULAR = 'REGULAR',
  FLEET = 'FLEET',
}

export interface Unit {
  id: number;
  gameId: string;
  name: string;
  unitType?: UnitType;
  alignment?: Alignment;
  factions: string[];
  tags: string[];
  portraitUrl?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export enum UnitType {
  CHARACTER = 'CHARACTER',
  SHIP = 'SHIP',
  CAPITAL_SHIP = 'CAPITAL_SHIP',
}

export interface SquadUnit {
  id: number;
  squadId: number;
  unitId: number;
  position?: number;
  isLeader: boolean;
  isRequired: boolean;
  notes?: string;
  unit: Unit;
}

// Recommendation Types
export interface MissionSquadRecommendation {
  id: number;
  missionId: number;
  squadId: number;
  version: number;
  isCurrent: boolean;
  effectiveFrom: string;
  priority: number;
  successRate?: number;
  difficultyRating?: number;
  submittedBy?: number;
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
  mission?: CombatMission;
  squad: Squad;
  submitter?: {
    id: number;
    username: string;
  };
}

// Video Types
export interface StrategyVideo {
  id: number;
  missionId?: number;
  squadId?: number;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  platform?: Platform;
  durationSeconds?: number;
  creatorName?: string;
  creatorChannelUrl?: string;
  viewCount: number;
  upvotes: number;
  downvotes: number;
  isFeatured: boolean;
  isActive: boolean;
  submittedBy?: number;
  approvedBy?: number;
  createdAt: string;
  mission?: CombatMission;
  squad?: Squad;
  submitter?: {
    id: number;
    username: string;
  };
}

export enum Platform {
  YOUTUBE = 'YOUTUBE',
  TWITCH = 'TWITCH',
}

// Wave Types
export interface MissionWave {
  id: number;
  missionId: number;
  waveNumber: number;
  enemies: any[];
  specialMechanics: string[];
  turnMeterPreload?: number;
  createdAt: string;
}

// Form Types
export interface CreateSquadData {
  name: string;
  description?: string;
  squadType?: SquadType;
  strategyNotes?: string;
  minPowerRequirement?: number;
  recommendedGearTier?: number;
  recommendedRelicLevel?: number;
}

export interface AddSquadUnitData {
  unitId: number;
  position?: number;
  isLeader?: boolean;
  isRequired?: boolean;
  notes?: string;
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalSquads: number;
  totalMissions: number;
  totalRecommendations: number;
  totalVideos: number;
  recentActivity: {
    newUsers: number;
    newSquads: number;
    newRecommendations: number;
  };
  usersByRole: {
    [key in UserRole]: number;
  };
}

export interface AuditLog {
  id: string;
  tableName: string;
  recordId?: number;
  action: string;
  oldValues?: any;
  newValues?: any;
  changedFields: string[];
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
}