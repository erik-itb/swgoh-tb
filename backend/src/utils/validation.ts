import { z } from 'zod';
import { UserRole, MissionType, CombatType, SquadType, Alignment } from '@prisma/client';

// Auth schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
});

// Squad schemas
export const createSquadSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  squadType: z.nativeEnum(SquadType).optional(),
  strategyNotes: z.string().optional(),
  minPowerRequirement: z.number().int().positive().optional(),
  recommendedGearTier: z.number().int().min(1).max(13).optional(),
  recommendedRelicLevel: z.number().int().min(1).max(9).optional(),
});

export const updateSquadSchema = createSquadSchema.partial();

export const addSquadUnitSchema = z.object({
  unitId: z.number().int().positive(),
  position: z.number().int().min(1).max(7).optional(),
  isLeader: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  notes: z.string().optional(),
});

// Mission recommendation schema
export const createRecommendationSchema = z.object({
  squadId: z.number().int().positive(),
  priority: z.number().int().min(1).max(10).optional(),
  successRate: z.number().min(0).max(100).optional(),
  difficultyRating: z.number().int().min(1).max(5).optional(),
});

// Video schemas
export const createVideoSchema = z.object({
  missionId: z.number().int().positive().optional(),
  squadId: z.number().int().positive().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  platform: z.enum(['YOUTUBE', 'TWITCH']).optional(),
  durationSeconds: z.number().int().positive().optional(),
  creatorName: z.string().max(100).optional(),
  creatorChannelUrl: z.string().url().optional(),
});

// Admin schemas
export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
});

// Query schemas
export const squadQuerySchema = z.object({
  squadType: z.nativeEnum(SquadType).optional(),
  published: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

export const missionQuerySchema = z.object({
  planetId: z.string().regex(/^\d+$/).transform(Number).optional(),
  missionType: z.nativeEnum(MissionType).optional(),
  combatType: z.nativeEnum(CombatType).optional(),
}).merge(paginationSchema);