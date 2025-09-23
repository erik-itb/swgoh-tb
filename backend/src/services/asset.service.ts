import { PrismaClient, AssetType, AssetSizeVariant, AssetFormat } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

/**
 * Asset Service for SWGoH character/ship portraits and icons
 * Uses local assets extracted with swgoh-ae2
 */
export class AssetService {
  private static readonly ASSET_BASE_URL = '/assets';
  private static readonly FALLBACK_PORTRAIT = '/assets/fallback/character-portrait.png';
  private static readonly FALLBACK_ICON = '/assets/fallback/character-icon.png';

  /**
   * Get unit portrait URL from local assets
   */
  static getUnitPortrait(gameId: string, size?: 'sm' | 'md' | 'lg'): string {
    if (!gameId) return this.FALLBACK_PORTRAIT;

    // Local asset structure: /assets/units/portraits/{gameId}.webp
    const sizePrefix = size ? `_${size}` : '';
    return `${this.ASSET_BASE_URL}/units/portraits/${gameId}${sizePrefix}.webp`;
  }

  /**
   * Get unit icon URL (smaller version) from local assets
   */
  static getUnitIcon(gameId: string): string {
    if (!gameId) return this.FALLBACK_ICON;

    // Local asset structure: /assets/units/icons/{gameId}.webp
    return `${this.ASSET_BASE_URL}/units/icons/${gameId}.webp`;
  }

  /**
   * Get ship portrait URL
   */
  static getShipPortrait(gameId: string): string {
    if (!gameId) return this.FALLBACK_PORTRAIT;
    
    // Ships might use different endpoint
    return `${this.ASSET_BASE_URL}/char/${gameId}`;
  }

  /**
   * Get planet background URL (placeholder for now)
   */
  static getPlanetBackground(planetSlug: string): string | null {
    // Placeholder - would need to map planet slugs to asset IDs
    // Could use swgoh-ae2 for planet backgrounds in future
    return null;
  }

  /**
   * Get planet icon URL (placeholder for now)  
   */
  static getPlanetIcon(planetSlug: string): string | null {
    // Placeholder - would need planet asset mapping
    return null;
  }

  /**
   * Validate if asset URL is accessible
   */
  static async validateAssetUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get unit with asset URLs populated
   */
  static async getUnitWithAssets(gameId: string) {
    const unit = await prisma.unit.findUnique({
      where: { gameId }
    });

    if (!unit) return null;

    return {
      ...unit,
      portraitUrl: this.getUnitPortrait(gameId),
      iconUrl: this.getUnitIcon(gameId),
      // Add computed asset URLs
      assets: {
        portrait: {
          sm: this.getUnitPortrait(gameId, 'sm'),
          md: this.getUnitPortrait(gameId, 'md'), 
          lg: this.getUnitPortrait(gameId, 'lg')
        },
        icon: this.getUnitIcon(gameId)
      }
    };
  }

  /**
   * Get multiple units with assets
   */
  static async getUnitsWithAssets(gameIds: string[]) {
    const units = await prisma.unit.findMany({
      where: {
        gameId: { in: gameIds }
      }
    });

    return units.map(unit => ({
      ...unit,
      portraitUrl: this.getUnitPortrait(unit.gameId),
      iconUrl: this.getUnitIcon(unit.gameId),
      assets: {
        portrait: {
          sm: this.getUnitPortrait(unit.gameId, 'sm'),
          md: this.getUnitPortrait(unit.gameId, 'md'),
          lg: this.getUnitPortrait(unit.gameId, 'lg')  
        },
        icon: this.getUnitIcon(unit.gameId)
      }
    }));
  }

  /**
   * Get asset URLs for squad units
   */
  static async getSquadWithAssets(squadId: number) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        units: {
          include: {
            unit: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!squad) return null;

    return {
      ...squad,
      units: squad.units.map(squadUnit => ({
        ...squadUnit,
        unit: {
          ...squadUnit.unit,
          portraitUrl: this.getUnitPortrait(squadUnit.unit.gameId),
          iconUrl: this.getUnitIcon(squadUnit.unit.gameId)
        }
      }))
    };
  }

  /**
   * Refresh asset cache by validating all unit URLs
   */
  static async refreshAssetCache(): Promise<{
    total: number;
    valid: number;
    invalid: number;
    errors: string[];
  }> {
    const units = await prisma.unit.findMany({
      select: { gameId: true }
    });

    const results = {
      total: units.length,
      valid: 0,
      invalid: 0,
      errors: [] as string[]
    };

    for (const unit of units) {
      try {
        const portraitUrl = this.getUnitPortrait(unit.gameId);
        const isValid = await this.validateAssetUrl(portraitUrl);
        
        if (isValid) {
          results.valid++;
        } else {
          results.invalid++;
          results.errors.push(`Invalid asset for ${unit.gameId}: ${portraitUrl}`);
        }
      } catch (error) {
        results.invalid++;
        results.errors.push(`Error checking ${unit.gameId}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Generate asset manifest for frontend caching
   */
  static async generateAssetManifest() {
    const units = await prisma.unit.findMany({
      select: { gameId: true, name: true, unitType: true }
    });

    const manifest = {
      generated: new Date().toISOString(),
      version: '1.0.0',
      baseUrl: this.ASSET_BASE_URL,
      assets: units.map(unit => ({
        gameId: unit.gameId,
        name: unit.name,
        type: unit.unitType,
        urls: {
          portrait: this.getUnitPortrait(unit.gameId),
          icon: this.getUnitIcon(unit.gameId)
        }
      }))
    };

    return manifest;
  }

  /**
   * Get asset URL from database metadata
   */
  static async getAssetFromMetadata(
    assetType: AssetType,
    gameId: string,
    sizeVariant: AssetSizeVariant = AssetSizeVariant.MD
  ): Promise<string | null> {
    const assetMetadata = await prisma.assetMetadata.findUnique({
      where: {
        assetType_gameId_sizeVariant: {
          assetType,
          gameId,
          sizeVariant
        }
      }
    });

    if (!assetMetadata || !assetMetadata.isActive) {
      return null;
    }

    // Return URL based on file path
    return `${this.ASSET_BASE_URL}/${assetMetadata.filePath}`;
  }

  /**
   * Register asset in metadata table
   */
  static async registerAsset(data: {
    assetType: AssetType;
    gameId: string;
    filePath: string;
    fileSize?: number;
    format?: AssetFormat;
    sizeVariant?: AssetSizeVariant;
    width?: number;
    height?: number;
    checksumMd5?: string;
    sourceVersion?: string;
  }) {
    return await prisma.assetMetadata.upsert({
      where: {
        assetType_gameId_sizeVariant: {
          assetType: data.assetType,
          gameId: data.gameId,
          sizeVariant: data.sizeVariant || AssetSizeVariant.MD
        }
      },
      update: {
        filePath: data.filePath,
        fileSize: data.fileSize,
        format: data.format || AssetFormat.WEBP,
        width: data.width,
        height: data.height,
        checksumMd5: data.checksumMd5,
        sourceVersion: data.sourceVersion,
        lastUpdated: new Date()
      },
      create: {
        assetType: data.assetType,
        gameId: data.gameId,
        filePath: data.filePath,
        fileSize: data.fileSize,
        format: data.format || AssetFormat.WEBP,
        sizeVariant: data.sizeVariant || AssetSizeVariant.MD,
        width: data.width,
        height: data.height,
        checksumMd5: data.checksumMd5,
        sourceVersion: data.sourceVersion
      }
    });
  }

  /**
   * Get comprehensive asset information
   */
  static async getAssetInfo(assetType: AssetType, gameId: string) {
    const assets = await prisma.assetMetadata.findMany({
      where: {
        assetType,
        gameId,
        isActive: true
      },
      orderBy: { sizeVariant: 'asc' }
    });

    const result: Record<string, any> = {};

    for (const asset of assets) {
      const sizeKey = asset.sizeVariant.toLowerCase();
      result[sizeKey] = {
        url: `${this.ASSET_BASE_URL}/${asset.filePath}`,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        format: asset.format,
        lastUpdated: asset.lastUpdated
      };
    }

    return result;
  }

  /**
   * Enhanced unit portrait with metadata support
   */
  static async getUnitPortraitAdvanced(gameId: string, size: AssetSizeVariant = AssetSizeVariant.MD) {
    // Try to get from metadata first
    const metadataUrl = await this.getAssetFromMetadata(AssetType.UNIT_PORTRAIT, gameId, size);
    if (metadataUrl) {
      return metadataUrl;
    }

    // Fallback to static method
    const sizeMap = {
      [AssetSizeVariant.SM]: 'sm',
      [AssetSizeVariant.MD]: 'md',
      [AssetSizeVariant.LG]: 'lg'
    };

    return this.getUnitPortrait(gameId, sizeMap[size] as 'sm' | 'md' | 'lg');
  }

  /**
   * Asset health monitoring
   */
  static async getAssetHealthReport() {
    const totalAssets = await prisma.assetMetadata.count();
    const activeAssets = await prisma.assetMetadata.count({
      where: { isActive: true }
    });

    const assetsByType = await prisma.assetMetadata.groupBy({
      by: ['assetType'],
      _count: true,
      where: { isActive: true }
    });

    const assetsByFormat = await prisma.assetMetadata.groupBy({
      by: ['format'],
      _count: true,
      where: { isActive: true }
    });

    const recentlyUpdated = await prisma.assetMetadata.count({
      where: {
        isActive: true,
        lastUpdated: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    return {
      total: totalAssets,
      active: activeAssets,
      inactive: totalAssets - activeAssets,
      recentlyUpdated,
      byType: assetsByType.reduce((acc, item) => {
        acc[item.assetType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byFormat: assetsByFormat.reduce((acc, item) => {
        acc[item.format] = item._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Clean up orphaned assets
   */
  static async cleanupOrphanedAssets(dryRun: boolean = true) {
    const orphanedAssets = await prisma.assetMetadata.findMany({
      where: {
        OR: [
          {
            assetType: AssetType.UNIT_PORTRAIT,
            gameId: {
              notIn: await prisma.unit.findMany({ select: { gameId: true } }).then(units => units.map(u => u.gameId))
            }
          },
          {
            assetType: AssetType.UNIT_ICON,
            gameId: {
              notIn: await prisma.unit.findMany({ select: { gameId: true } }).then(units => units.map(u => u.gameId))
            }
          }
        ]
      }
    });

    if (!dryRun && orphanedAssets.length > 0) {
      await prisma.assetMetadata.updateMany({
        where: {
          id: { in: orphanedAssets.map(a => a.id) }
        },
        data: { isActive: false }
      });
    }

    return {
      found: orphanedAssets.length,
      assets: orphanedAssets.map(a => ({ id: a.id, assetType: a.assetType, gameId: a.gameId })),
      cleaned: !dryRun
    };
  }

  /**
   * Bulk import assets from directory
   */
  static async bulkImportAssets(assetsDir: string, assetType: AssetType) {
    const results = {
      processed: 0,
      imported: 0,
      errors: [] as string[]
    };

    try {
      const files = await fs.readdir(assetsDir);
      const imageFiles = files.filter(file =>
        file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg')
      );

      for (const file of imageFiles) {
        results.processed++;

        try {
          const filePath = path.join(assetsDir, file);
          const stats = await fs.stat(filePath);
          const gameId = path.parse(file).name.replace(/_(sm|md|lg)$/, '');

          // Determine size variant from filename
          let sizeVariant = AssetSizeVariant.MD;
          if (file.includes('_sm.')) sizeVariant = AssetSizeVariant.SM;
          else if (file.includes('_lg.')) sizeVariant = AssetSizeVariant.LG;

          // Determine format
          let format = AssetFormat.WEBP;
          if (file.endsWith('.png')) format = AssetFormat.PNG;
          else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) format = AssetFormat.JPEG;

          await this.registerAsset({
            assetType,
            gameId,
            filePath: path.relative(path.join(process.cwd(), 'assets'), filePath),
            fileSize: stats.size,
            format,
            sizeVariant
          });

          results.imported++;
        } catch (error) {
          results.errors.push(`Failed to import ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to read directory ${assetsDir}: ${error.message}`);
    }

    return results;
  }
}