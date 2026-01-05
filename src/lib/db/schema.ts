import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users table for authentication
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  role: text('role').notNull().default('admin'), // 'super_admin' or 'admin'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Instructions table for TB mission guides
export const instructions = sqliteTable('instructions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  phase: integer('phase').notNull(), // 1-6
  planet: text('planet').notNull(),
  missionNumber: integer('mission_number').notNull(),
  missionType: text('mission_type').notNull().default('combat'),
  isAutoPlay: integer('is_auto_play', { mode: 'boolean' }).notNull().default(false),
  content: text('content').notNull(),
  
  // Squad composition
  squadLeaderId: text('squad_leader_id'),
  squadMember1Id: text('squad_member1_id'),
  squadMember2Id: text('squad_member2_id'),
  squadMember3Id: text('squad_member3_id'),
  squadMember4Id: text('squad_member4_id'),
  
  // Fleet composition
  capitalShipId: text('capital_ship_id'),
  starting1Id: text('starting1_id'),
  starting2Id: text('starting2_id'),
  starting3Id: text('starting3_id'),
  reinforcement1Id: text('reinforcement1_id'),
  reinforcement2Id: text('reinforcement2_id'),
  reinforcement3Id: text('reinforcement3_id'),
  reinforcement4Id: text('reinforcement4_id'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Videos table for instruction videos
export const videos = sqliteTable('videos', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  title: text('title'),
  instructionId: text('instruction_id').notNull().references(() => instructions.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Instruction = typeof instructions.$inferSelect;
export type NewInstruction = typeof instructions.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
