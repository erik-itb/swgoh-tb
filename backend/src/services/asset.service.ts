import { PrismaClient } from '@prisma/client';

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
}