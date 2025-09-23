import { Request, Response } from 'express';
import { AssetService } from '../services/asset.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UnitController {
  /**
   * Get all units with asset URLs
   */
  static async getAllUnits(req: Request, res: Response) {
    try {
      const { 
        alignment, 
        unitType, 
        search,
        limit = '100',
        offset = '0' 
      } = req.query;

      // Build where clause
      const where: any = {
        isActive: true
      };

      if (alignment && alignment !== 'all') {
        where.alignment = alignment;
      }

      if (unitType && unitType !== 'all') {
        where.unitType = unitType;
      }

      if (search) {
        where.OR = [
          {
            name: {
              contains: search as string,
              mode: 'insensitive'
            }
          },
          {
            gameId: {
              contains: search as string,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Get units
      const units = await prisma.unit.findMany({
        where,
        orderBy: [
          { name: 'asc' }
        ],
        take: Math.min(parseInt(limit as string), 500),
        skip: parseInt(offset as string)
      });

      // Add asset URLs
      const unitsWithAssets = units.map(unit => ({
        ...unit,
        portraitUrl: AssetService.getUnitPortrait(unit.gameId),
        iconUrl: AssetService.getUnitIcon(unit.gameId)
      }));

      res.json(unitsWithAssets);
    } catch (error) {
      console.error('Error fetching units:', error);
      res.status(500).json({ 
        error: 'Failed to fetch units',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get a specific unit by ID with assets
   */
  static async getUnitById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const unit = await AssetService.getUnitWithAssets(id);
      
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }

      res.json(unit);
    } catch (error) {
      console.error('Error fetching unit:', error);
      res.status(500).json({ 
        error: 'Failed to fetch unit',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get multiple units by gameIds
   */
  static async getUnitsByGameIds(req: Request, res: Response) {
    try {
      const { gameIds } = req.body;
      
      if (!Array.isArray(gameIds)) {
        return res.status(400).json({ error: 'gameIds must be an array' });
      }

      const units = await AssetService.getUnitsWithAssets(gameIds);
      res.json(units);
    } catch (error) {
      console.error('Error fetching units by gameIds:', error);
      res.status(500).json({ 
        error: 'Failed to fetch units',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search units by name or gameId
   */
  static async searchUnits(req: Request, res: Response) {
    try {
      const { q, limit = '20' } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query (q) is required' });
      }

      const units = await prisma.unit.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                {
                  name: {
                    contains: q,
                    mode: 'insensitive'
                  }
                },
                {
                  gameId: {
                    contains: q,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          ]
        },
        orderBy: [
          { name: 'asc' }
        ],
        take: parseInt(limit as string)
      });

      // Add asset URLs
      const unitsWithAssets = units.map(unit => ({
        ...unit,
        portraitUrl: AssetService.getUnitPortrait(unit.gameId),
        iconUrl: AssetService.getUnitIcon(unit.gameId)
      }));

      res.json(unitsWithAssets);
    } catch (error) {
      console.error('Error searching units:', error);
      res.status(500).json({ 
        error: 'Failed to search units',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get unit stats and metadata
   */
  static async getUnitStats(req: Request, res: Response) {
    try {
      const stats = await prisma.unit.groupBy({
        by: ['alignment', 'unitType'],
        _count: true,
        where: {
          isActive: true
        }
      });

      const totalUnits = await prisma.unit.count({
        where: { isActive: true }
      });

      res.json({
        totalUnits,
        breakdown: stats.map(stat => ({
          alignment: stat.alignment,
          unitType: stat.unitType,
          count: stat._count
        }))
      });
    } catch (error) {
      console.error('Error fetching unit stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch unit stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}