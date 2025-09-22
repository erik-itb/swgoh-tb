import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface AuditableRequest extends AuthenticatedRequest {
  auditLog?: {
    tableName: string;
    recordId?: number;
    oldValues?: any;
  };
}

export const auditMiddleware = (tableName: string) => {
  return async (req: AuditableRequest, res: Response, next: NextFunction) => {
    // Store audit info for later use
    req.auditLog = { tableName };

    // Override res.json to capture the response
    const originalJson = res.json;
    let responseData: any;

    res.json = function(data: any) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Override res.end to log after response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const result = originalEnd.call(this, chunk, encoding);

      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditEvent(req, responseData).catch(error => {
          logger.error('Failed to create audit log', { error: error.message });
        });
      }

      return result;
    };

    next();
  };
};

async function logAuditEvent(req: AuditableRequest, responseData: any) {
  const { method, auditLog, user, ip } = req;

  if (!auditLog) return;

  // Determine action based on HTTP method
  let action: string;
  switch (method) {
    case 'POST':
      action = 'INSERT';
      break;
    case 'PUT':
    case 'PATCH':
      action = 'UPDATE';
      break;
    case 'DELETE':
      action = 'DELETE';
      break;
    default:
      return; // Don't log GET requests
  }

  try {
    await prisma.auditLog.create({
      data: {
        tableName: auditLog.tableName,
        recordId: responseData?.data?.id || auditLog.recordId,
        action,
        oldValues: auditLog.oldValues || null,
        newValues: action === 'DELETE' ? null : responseData?.data || null,
        changedFields: getChangedFields(auditLog.oldValues, responseData?.data),
        userId: user?.userId || null,
        ipAddress: ip || null,
        userAgent: req.get('user-agent') || null,
      },
    });
  } catch (error) {
    logger.error('Audit log creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tableName: auditLog.tableName,
      action,
      userId: user?.userId
    });
  }
}

function getChangedFields(oldValues: any, newValues: any): string[] {
  if (!oldValues || !newValues) return [];

  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  for (const key of allKeys) {
    if (key === 'updatedAt' || key === 'createdAt') continue; // Skip timestamp fields

    if (oldValues[key] !== newValues[key]) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

// Helper to capture old values before update/delete operations
export const captureOldValues = (tableName: string, idField: string = 'id') => {
  return async (req: AuditableRequest, res: Response, next: NextFunction) => {
    if (!req.auditLog) {
      req.auditLog = { tableName };
    }

    const id = parseInt(req.params[idField]);
    if (!id || isNaN(id)) {
      return next();
    }

    try {
      let oldRecord;

      switch (tableName) {
        case 'users':
          oldRecord = await prisma.user.findUnique({ where: { id } });
          break;
        case 'squads':
          oldRecord = await prisma.squad.findUnique({ where: { id } });
          break;
        case 'combat_missions':
          oldRecord = await prisma.combatMission.findUnique({ where: { id } });
          break;
        case 'mission_squad_recommendations':
          oldRecord = await prisma.missionSquadRecommendation.findUnique({ where: { id } });
          break;
        case 'strategy_videos':
          oldRecord = await prisma.strategyVideo.findUnique({ where: { id } });
          break;
        default:
          logger.warn('Unknown table for audit capture', { tableName });
      }

      if (oldRecord) {
        req.auditLog.oldValues = oldRecord;
        req.auditLog.recordId = id;
      }
    } catch (error) {
      logger.error('Failed to capture old values for audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tableName,
        id
      });
    }

    next();
  };
};