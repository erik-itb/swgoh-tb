export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SWGOH RotE TB Tracker';

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'swgoh_tb_token',
  REFRESH_TOKEN: 'swgoh_tb_refresh',
  USER_DATA: 'swgoh_tb_user',
  THEME: 'swgoh_tb_theme',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  TERRITORY_BATTLE: '/tb/:slug',
  PHASE: '/tb/:slug/phase/:phaseId',
  PLANET: '/tb/:slug/planet/:planetId',
  MISSION: '/tb/:slug/mission/:missionId',
  SQUADS: '/squads',
  SQUAD_DETAIL: '/squads/:id',
  CREATE_SQUAD: '/squads/create',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_AUDIT: '/admin/audit',
  PROFILE: '/profile',
} as const;

export const ROLE_COLORS = {
  VIEWER: 'text-neutral-400',
  CONTRIBUTOR: 'text-blue-400',
  ADMIN: 'text-amber-400',
  SUPER_ADMIN: 'text-red-400',
} as const;

export const ALIGNMENT_COLORS = {
  DARK_SIDE: 'border-red-600 bg-red-600/10',
  LIGHT_SIDE: 'border-blue-600 bg-blue-600/10',
  MIXED: 'border-purple-600 bg-purple-600/10',
} as const;

export const MISSION_TYPE_COLORS = {
  COMBAT: 'border-neutral-500 bg-neutral-500/10',
  SPECIAL: 'border-amber-500 bg-amber-500/10',
  FLEET: 'border-blue-500 bg-blue-500/10',
  OPERATIONS: 'border-green-500 bg-green-500/10',
} as const;

export const DIFFICULTY_COLORS = {
  1: 'text-green-400',
  2: 'text-green-400',
  3: 'text-yellow-400',
  4: 'text-yellow-400',
  5: 'text-orange-400',
  6: 'text-orange-400',
  7: 'text-red-400',
  8: 'text-red-400',
  9: 'text-red-500',
  10: 'text-red-600',
} as const;

export const SUCCESS_RATE_COLORS = {
  LOW: 'text-red-400', // 0-50%
  MEDIUM: 'text-yellow-400', // 51-75%
  HIGH: 'text-green-400', // 76-100%
} as const;

export const UNIT_TYPE_ICONS = {
  CHARACTER: '👤',
  SHIP: '🚀',
  CAPITAL_SHIP: '🛸',
} as const;

export const PLATFORM_COLORS = {
  YOUTUBE: 'text-red-500',
  TWITCH: 'text-purple-500',
} as const;

export const TOAST_DURATION = 5000;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;