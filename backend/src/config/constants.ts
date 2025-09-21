export const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  GENERAL: {
    windowMs: 15 * 60 * 1000,
    max: 1000, // 1000 requests per window
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const BCRYPT_ROUNDS = 12;

export const USER_ROLES = {
  VIEWER: 'VIEWER',
  CONTRIBUTOR: 'CONTRIBUTOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const MISSION_TYPES = {
  COMBAT: 'COMBAT',
  SPECIAL: 'SPECIAL',
  FLEET: 'FLEET',
  OPERATIONS: 'OPERATIONS',
} as const;

export const ALIGNMENTS = {
  DARK_SIDE: 'DARK_SIDE',
  LIGHT_SIDE: 'LIGHT_SIDE',
  MIXED: 'MIXED',
} as const;