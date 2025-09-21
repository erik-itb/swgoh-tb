import { Router } from 'express';
import * as squadController from '../controllers/squad.controller.js';
import { authenticateToken, requireContributor } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { auditMiddleware, captureOldValues } from '../middleware/audit.js';
import {
  createSquadSchema,
  updateSquadSchema,
  addSquadUnitSchema,
  squadQuerySchema
} from '../utils/validation.js';

const router = Router();

// Public routes
router.get('/', validateQuery(squadQuerySchema), squadController.getSquads);
router.get('/:id', squadController.getSquadById);

// Protected routes - require contributor role or higher
router.post(
  '/',
  authenticateToken,
  requireContributor,
  validateBody(createSquadSchema),
  auditMiddleware('squads'),
  squadController.createSquad
);

router.put(
  '/:id',
  authenticateToken,
  requireContributor,
  captureOldValues('squads'),
  validateBody(updateSquadSchema),
  auditMiddleware('squads'),
  squadController.updateSquad
);

router.delete(
  '/:id',
  authenticateToken,
  requireContributor,
  captureOldValues('squads'),
  auditMiddleware('squads'),
  squadController.deleteSquad
);

router.post(
  '/:id/units',
  authenticateToken,
  requireContributor,
  validateBody(addSquadUnitSchema),
  auditMiddleware('squad_units'),
  squadController.addUnitToSquad
);

router.delete(
  '/:id/units/:unitId',
  authenticateToken,
  requireContributor,
  auditMiddleware('squad_units'),
  squadController.removeUnitFromSquad
);

router.post(
  '/:id/publish',
  authenticateToken,
  requireContributor,
  captureOldValues('squads'),
  auditMiddleware('squads'),
  squadController.publishSquad
);

export default router;