import { Router } from 'express';
import { UnitController } from '../controllers/unit.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * Unit routes
 * All routes handle units with asset URLs automatically
 */

// Public routes (no authentication required)
router.get('/', UnitController.getAllUnits);
router.get('/search', UnitController.searchUnits);
router.get('/stats', UnitController.getUnitStats);
router.get('/:id', UnitController.getUnitById);

// Routes requiring authentication
router.post('/by-gameids', authenticateToken, UnitController.getUnitsByGameIds);

export default router;