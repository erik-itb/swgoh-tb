import { Request, Response } from 'express';
import { TerritoryBattleService } from '../services/tb.service.js';
import { ApiResponse, PaginationParams } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { PAGINATION } from '../config/constants.js';

const tbService = new TerritoryBattleService();

export const getTerritoryBattles = async (req: Request, res: Response) => {
  try {
    const territoryBattles = await tbService.getTerritoryBattles();

    res.json({
      success: true,
      data: territoryBattles
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get territory battles', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get territory battles'
    } as ApiResponse);
  }
};

export const getTerritoryBattleBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const territoryBattle = await tbService.getTerritoryBattleBySlug(slug);

    res.json({
      success: true,
      data: territoryBattle
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get territory battle', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug: req.params.slug
    });

    const statusCode = error instanceof Error && error.message === 'Territory Battle not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get territory battle'
    } as ApiResponse);
  }
};

export const getPhase = async (req: Request, res: Response) => {
  try {
    const phaseId = parseInt(req.params.id);
    const phase = await tbService.getPhase(phaseId);

    res.json({
      success: true,
      data: phase
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get phase', {
      error: error instanceof Error ? error.message : 'Unknown error',
      phaseId: req.params.id
    });

    const statusCode = error instanceof Error && error.message === 'Phase not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get phase'
    } as ApiResponse);
  }
};

export const getPlanet = async (req: Request, res: Response) => {
  try {
    const planetId = parseInt(req.params.id);
    const planet = await tbService.getPlanet(planetId);

    res.json({
      success: true,
      data: planet
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get planet', {
      error: error instanceof Error ? error.message : 'Unknown error',
      planetId: req.params.id
    });

    const statusCode = error instanceof Error && error.message === 'Planet not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get planet'
    } as ApiResponse);
  }
};

export const getMission = async (req: Request, res: Response) => {
  try {
    const missionId = parseInt(req.params.id);
    const mission = await tbService.getMission(missionId);

    res.json({
      success: true,
      data: mission
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get mission', {
      error: error instanceof Error ? error.message : 'Unknown error',
      missionId: req.params.id
    });

    const statusCode = error instanceof Error && error.message === 'Mission not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mission'
    } as ApiResponse);
  }
};

export const getMissionWaves = async (req: Request, res: Response) => {
  try {
    const missionId = parseInt(req.params.id);
    const waves = await tbService.getMissionWaves(missionId);

    res.json({
      success: true,
      data: waves
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get mission waves', {
      error: error instanceof Error ? error.message : 'Unknown error',
      missionId: req.params.id
    });

    const statusCode = error instanceof Error && error.message === 'Mission not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mission waves'
    } as ApiResponse);
  }
};

export const getMissionRecommendations = async (req: Request, res: Response) => {
  try {
    const missionId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    const pagination: PaginationParams = {
      page,
      limit,
      offset: (page - 1) * limit
    };

    const { recommendations, total } = await tbService.getMissionRecommendations(missionId, pagination);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: recommendations,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get mission recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      missionId: req.params.id
    });

    const statusCode = error instanceof Error && error.message === 'Mission not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mission recommendations'
    } as ApiResponse);
  }
};

export const getMissionVideos = async (req: Request, res: Response) => {
  try {
    const missionId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    const pagination: PaginationParams = {
      page,
      limit,
      offset: (page - 1) * limit
    };

    const { videos, total } = await tbService.getMissionVideos(missionId, pagination);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get mission videos', {
      error: error instanceof Error ? error.message : 'Unknown error',
      missionId: req.params.id
    });

    const statusCode = error instanceof Error && error.message === 'Mission not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mission videos'
    } as ApiResponse);
  }
};