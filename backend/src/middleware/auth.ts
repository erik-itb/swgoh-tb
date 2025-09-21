import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions attempt', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: roles,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Helper for admin-only routes
export const requireAdmin = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

// Helper for contributor+ routes
export const requireContributor = requireRole([
  UserRole.CONTRIBUTOR,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN
]);

// Optional auth - sets user if token is valid, but doesn't reject if not
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  next();
};