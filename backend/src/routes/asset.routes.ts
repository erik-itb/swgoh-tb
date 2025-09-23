import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';

const router = Router();

// Asset retrieval endpoints
router.get('/unit/:gameId/portrait', AssetController.getUnitPortrait);
router.get('/unit/:gameId/icon', AssetController.getUnitIcon);
router.get('/unit/:gameId/assets', AssetController.getUnitAssets);

// Asset management endpoints
router.get('/manifest', AssetController.getAssetManifest);
router.get('/health', AssetController.getHealthReport);
router.post('/refresh-cache', AssetController.refreshCache);
router.get('/search', AssetController.searchAssets);

// Asset maintenance endpoints
router.post('/cleanup-orphaned', AssetController.cleanupOrphaned);
router.post('/bulk-import', AssetController.bulkImport);
router.post('/register', AssetController.registerAsset);

// Legacy endpoints (backwards compatibility)
router.get('/image/:gameId', AssetController.proxyImage);

export { router as assetRoutes };