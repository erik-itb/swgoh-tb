import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';

const router = Router();

// Image proxy endpoint
router.get('/image/:gameId', AssetController.proxyImage);

export { router as assetRoutes };