import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { auditMiddleware, captureOldValues } from '../middleware/audit.js';
import {
  updateUserRoleSchema,
  paginationSchema
} from '../utils/validation.js';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// User management
router.get('/users', validateQuery(paginationSchema), adminController.getUsers);
router.put(
  '/users/:id',
  captureOldValues('users'),
  validateBody(updateUserRoleSchema),
  auditMiddleware('users'),
  adminController.updateUser
);

// System monitoring
router.get('/audit-logs', validateQuery(paginationSchema), adminController.getAuditLogs);
router.get('/stats', adminController.getSystemStats);

// Content moderation
router.post(
  '/recommendations/:id/approve',
  captureOldValues('mission_squad_recommendations'),
  auditMiddleware('mission_squad_recommendations'),
  adminController.approveRecommendation
);

router.post(
  '/videos/:id/approve',
  captureOldValues('strategy_videos'),
  auditMiddleware('strategy_videos'),
  adminController.approveVideo
);

router.put(
  '/videos/:id/feature',
  captureOldValues('strategy_videos'),
  auditMiddleware('strategy_videos'),
  adminController.featureVideo
);

// Content deletion
router.delete(
  '/squads/:id',
  captureOldValues('squads'),
  auditMiddleware('squads'),
  adminController.deleteSquad
);

router.delete(
  '/videos/:id',
  captureOldValues('strategy_videos'),
  auditMiddleware('strategy_videos'),
  adminController.deleteVideo
);

export default router;