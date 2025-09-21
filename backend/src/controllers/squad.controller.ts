import { Request, Response } from 'express';
import { SquadService } from '../services/squad.service.js';
import { AuthenticatedRequest, ApiResponse, PaginationParams } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { PAGINATION } from '../config/constants.js';

const squadService = new SquadService();

export const getSquads = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      squadType,
      published,
      search
    } = req.query;

    const pagination: PaginationParams = {
      page: Number(page),
      limit: Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE),
      offset: (Number(page) - 1) * Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE)
    };

    const queryParams = {
      ...pagination,
      squadType: squadType as any,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      search: search as string
    };

    const { squads, total } = await squadService.getSquads(queryParams);
    const totalPages = Math.ceil(total / pagination.limit);

    res.json({
      success: true,
      data: squads,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get squads', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get squads'
    } as ApiResponse);
  }
};

export const getSquadById = async (req: Request, res: Response) => {
  try {
    const squadId = parseInt(req.params.id);
    const squad = await squadService.getSquadById(squadId);

    res.json({
      success: true,
      data: squad
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get squad', {
      error: error instanceof Error ? error.message : 'Unknown error',
      squadId: req.params.id
    });

    const statusCode = error instanceof Error && error.message === 'Squad not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get squad'
    } as ApiResponse);
  }
};

export const createSquad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const squad = await squadService.createSquad(req.user.userId, req.body);

    logger.info('Squad created', {
      squadId: squad.id,
      userId: req.user.userId,
      squadName: squad.name
    });

    res.status(201).json({
      success: true,
      data: squad,
      message: 'Squad created successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Squad creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create squad'
    } as ApiResponse);
  }
};

export const updateSquad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const squadId = parseInt(req.params.id);
    const squad = await squadService.updateSquad(squadId, req.user.userId, req.body);

    logger.info('Squad updated', {
      squadId,
      userId: req.user.userId,
      changes: Object.keys(req.body)
    });

    res.json({
      success: true,
      data: squad,
      message: 'Squad updated successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Squad update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      squadId: req.params.id,
      userId: req.user?.userId
    });

    const statusCode = error instanceof Error &&
      (error.message === 'Squad not found' || error.message === 'Permission denied') ?
      (error.message === 'Squad not found' ? 404 : 403) : 400;

    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update squad'
    } as ApiResponse);
  }
};

export const deleteSquad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const squadId = parseInt(req.params.id);
    await squadService.deleteSquad(squadId, req.user.userId);

    logger.info('Squad deleted', {
      squadId,
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Squad deleted successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Squad deletion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      squadId: req.params.id,
      userId: req.user?.userId
    });

    const statusCode = error instanceof Error &&
      (error.message === 'Squad not found' || error.message === 'Permission denied') ?
      (error.message === 'Squad not found' ? 404 : 403) : 400;

    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete squad'
    } as ApiResponse);
  }
};

export const addUnitToSquad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const squadId = parseInt(req.params.id);
    const squadUnit = await squadService.addUnitToSquad(squadId, req.user.userId, req.body);

    logger.info('Unit added to squad', {
      squadId,
      unitId: squadUnit.unitId,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: squadUnit,
      message: 'Unit added to squad successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Add unit to squad failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      squadId: req.params.id,
      userId: req.user?.userId
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add unit to squad'
    } as ApiResponse);
  }
};

export const removeUnitFromSquad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const squadId = parseInt(req.params.id);
    const unitId = parseInt(req.params.unitId);
    await squadService.removeUnitFromSquad(squadId, unitId, req.user.userId);

    logger.info('Unit removed from squad', {
      squadId,
      unitId,
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Unit removed from squad successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Remove unit from squad failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      squadId: req.params.id,
      unitId: req.params.unitId,
      userId: req.user?.userId
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove unit from squad'
    } as ApiResponse);
  }
};

export const publishSquad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const squadId = parseInt(req.params.id);
    const squad = await squadService.publishSquad(squadId, req.user.userId);

    logger.info('Squad published', {
      squadId,
      userId: req.user.userId
    });

    res.json({
      success: true,
      data: squad,
      message: 'Squad published successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Squad publish failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      squadId: req.params.id,
      userId: req.user?.userId
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish squad'
    } as ApiResponse);
  }
};