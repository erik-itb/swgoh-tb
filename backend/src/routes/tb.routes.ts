import { Router } from 'express';
import * as tbController from '../controllers/tb.controller.js';
import { validateQuery } from '../middleware/validation.js';
import { paginationSchema } from '../utils/validation.js';

const router = Router();

// Territory Battle routes
router.get('/', tbController.getTerritoryBattles);
router.get('/:slug', tbController.getTerritoryBattleBySlug);

// Phase routes
router.get('/phases/:id', tbController.getPhase);

// Planet routes
router.get('/planets/:id', tbController.getPlanet);

// Mission routes
router.get('/missions/:id', tbController.getMission);
router.get('/missions/:id/waves', tbController.getMissionWaves);
router.get('/missions/:id/recommendations', validateQuery(paginationSchema), tbController.getMissionRecommendations);
router.get('/missions/:id/videos', validateQuery(paginationSchema), tbController.getMissionVideos);

export default router;