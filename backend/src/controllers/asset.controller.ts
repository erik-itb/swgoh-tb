import { Request, Response } from 'express';
import { AssetService } from '../services/asset.service';
import { AssetType, AssetSizeVariant } from '@prisma/client';

export class AssetController {
  /**
   * Get unit portrait with size variants
   */
  static async getUnitPortrait(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const { size } = req.query;

      if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
      }

      let sizeVariant = AssetSizeVariant.MD;
      if (size === 'sm') sizeVariant = AssetSizeVariant.SM;
      else if (size === 'lg') sizeVariant = AssetSizeVariant.LG;

      const portraitUrl = await AssetService.getUnitPortraitAdvanced(gameId, sizeVariant);

      if (!portraitUrl) {
        return res.status(404).json({ error: 'Portrait not found' });
      }

      res.json({
        gameId,
        size: sizeVariant,
        url: portraitUrl
      });
    } catch (error) {
      console.error('Error getting unit portrait:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get unit icon
   */
  static async getUnitIcon(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
      }

      const iconUrl = await AssetService.getAssetFromMetadata(
        AssetType.UNIT_ICON,
        gameId,
        AssetSizeVariant.MD
      ) || AssetService.getUnitIcon(gameId);

      res.json({
        gameId,
        url: iconUrl
      });
    } catch (error) {
      console.error('Error getting unit icon:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get comprehensive asset info for a unit
   */
  static async getUnitAssets(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
      }

      const [portraitInfo, iconInfo] = await Promise.all([
        AssetService.getAssetInfo(AssetType.UNIT_PORTRAIT, gameId),
        AssetService.getAssetInfo(AssetType.UNIT_ICON, gameId)
      ]);

      res.json({
        gameId,
        portraits: portraitInfo,
        icons: iconInfo
      });
    } catch (error) {
      console.error('Error getting unit assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset manifest for frontend caching
   */
  static async getAssetManifest(req: Request, res: Response) {
    try {
      const manifest = await AssetService.generateAssetManifest();

      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.json(manifest);
    } catch (error) {
      console.error('Error generating asset manifest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset health report
   */
  static async getHealthReport(req: Request, res: Response) {
    try {
      const report = await AssetService.getAssetHealthReport();
      res.json(report);
    } catch (error) {
      console.error('Error getting asset health report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Refresh asset cache validation
   */
  static async refreshCache(req: Request, res: Response) {
    try {
      const report = await AssetService.refreshAssetCache();
      res.json(report);
    } catch (error) {
      console.error('Error refreshing asset cache:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Clean up orphaned assets
   */
  static async cleanupOrphaned(req: Request, res: Response) {
    try {
      const { dryRun = 'true' } = req.query;
      const isDryRun = dryRun === 'true';

      const result = await AssetService.cleanupOrphanedAssets(isDryRun);
      res.json(result);
    } catch (error) {
      console.error('Error cleaning up orphaned assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Bulk import assets from directory
   */
  static async bulkImport(req: Request, res: Response) {
    try {
      const { assetType, directory } = req.body;

      if (!assetType || !directory) {
        return res.status(400).json({
          error: 'assetType and directory are required'
        });
      }

      // Validate asset type
      if (!Object.values(AssetType).includes(assetType)) {
        return res.status(400).json({
          error: 'Invalid asset type'
        });
      }

      const result = await AssetService.bulkImportAssets(directory, assetType);
      res.json(result);
    } catch (error) {
      console.error('Error during bulk import:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Register single asset
   */
  static async registerAsset(req: Request, res: Response) {
    try {
      const assetData = req.body;

      // Validate required fields
      if (!assetData.assetType || !assetData.gameId || !assetData.filePath) {
        return res.status(400).json({
          error: 'assetType, gameId, and filePath are required'
        });
      }

      const result = await AssetService.registerAsset(assetData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error registering asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Legacy image proxy endpoint (for backwards compatibility)
   */
  static async proxyImage(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const { size } = req.query;

      if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
      }

      // Try to get advanced portrait first
      let sizeVariant = AssetSizeVariant.MD;
      if (size === 'sm') sizeVariant = AssetSizeVariant.SM;
      else if (size === 'lg') sizeVariant = AssetSizeVariant.LG;

      const portraitUrl = await AssetService.getUnitPortraitAdvanced(gameId, sizeVariant);

      if (portraitUrl) {
        // Redirect to actual asset
        return res.redirect(portraitUrl);
      }

      // Fallback to placeholder
      res.redirect('/assets/fallback/character-portrait.png');
    } catch (error) {
      console.error('Error proxying image:', error);
      res.redirect('/assets/fallback/character-portrait.png');
    }
  }

  /**
   * Search assets by criteria
   */
  static async searchAssets(req: Request, res: Response) {
    try {
      const {
        assetType,
        gameId,
        format,
        sizeVariant,
        isActive = 'true',
        limit = '50',
        offset = '0'
      } = req.query;

      const where: any = {};

      if (assetType && Object.values(AssetType).includes(assetType as AssetType)) {
        where.assetType = assetType;
      }

      if (gameId) {
        where.gameId = { contains: gameId as string, mode: 'insensitive' };
      }

      if (format) {
        where.format = format;
      }

      if (sizeVariant) {
        where.sizeVariant = sizeVariant;
      }

      where.isActive = isActive === 'true';

      const assets = await AssetService['prisma'].assetMetadata.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { lastUpdated: 'desc' }
      });

      const total = await AssetService['prisma'].assetMetadata.count({ where });

      res.json({
        assets: assets.map(asset => ({
          ...asset,
          url: `${AssetService['ASSET_BASE_URL']}/${asset.filePath}`
        })),
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: total > parseInt(offset as string) + parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Error searching assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}