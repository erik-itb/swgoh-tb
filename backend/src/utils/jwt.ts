import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRole } from '@prisma/client';

export interface JwtPayload extends BaseJwtPayload {
  userId: number;
  role: UserRole;
}

export function generateToken(userId: number, role: UserRole): string {
  return jwt.sign(
    { userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY } as any
  );
}

export function verifyToken(token: string): JwtPayload {
  const secret = env.JWT_SECRET;
  return jwt.verify(token, secret) as JwtPayload;
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: '7d' } as any
  );
}