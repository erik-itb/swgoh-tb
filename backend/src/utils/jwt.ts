import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  role: UserRole;
  iat: number;
  exp: number;
}

export function generateToken(userId: number, role: UserRole): string {
  return jwt.sign(
    { userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}