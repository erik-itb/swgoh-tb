import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AuthenticatedRequest, ApiResponse, PaginationParams } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { PAGINATION } from '../config/constants.js';

const adminService = new AdminService();

export const getUsers = async (req: Request, res: Response) => {
  try {
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

    const { users, total } = await adminService.getUsers(pagination);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get users', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    } as ApiResponse);
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await adminService.updateUser(userId, req.body);

    logger.info('Admin updated user', {
      targetUserId: userId,
      adminId: req.user?.userId,
      changes: Object.keys(req.body)
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Admin user update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      targetUserId: req.params.id,
      adminId: req.user?.userId
    });

    const statusCode = error instanceof Error && error.message === 'User not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    } as ApiResponse);
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
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

    const { logs, total } = await adminService.getAuditLogs(pagination);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs'
    } as ApiResponse);
  }
};

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getSystemStats();

    res.json({
      success: true,
      data: stats
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get system stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get system stats'
    } as ApiResponse);
  }
};

export const approveRecommendation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const recommendationId = parseInt(req.params.id);
    const recommendation = await adminService.approveRecommendation(recommendationId, req.user.userId);

    logger.info('Recommendation approved', {
      recommendationId,
      adminId: req.user.userId
    });

    res.json({
      success: true,
      data: recommendation,
      message: 'Recommendation approved successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Recommendation approval failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendationId: req.params.id,
      adminId: req.user?.userId
    });

    const statusCode = error instanceof Error && error.message === 'Recommendation not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve recommendation'
    } as ApiResponse);
  }
};

export const approveVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
    }

    const videoId = parseInt(req.params.id);
    const video = await adminService.approveVideo(videoId, req.user.userId);

    logger.info('Video approved', {
      videoId,
      adminId: req.user.userId
    });

    res.json({
      success: true,
      data: video,
      message: 'Video approved successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Video approval failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      videoId: req.params.id,
      adminId: req.user?.userId
    });

    const statusCode = error instanceof Error && error.message === 'Video not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve video'
    } as ApiResponse);
  }
};

export const featureVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    const { featured } = req.body;
    const video = await adminService.featureVideo(videoId, featured);

    logger.info('Video feature status changed', {
      videoId,
      featured,
      adminId: req.user?.userId
    });

    res.json({
      success: true,
      data: video,
      message: `Video ${featured ? 'featured' : 'unfeatured'} successfully`
    } as ApiResponse);
  } catch (error) {
    logger.warn('Video feature update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      videoId: req.params.id,
      adminId: req.user?.userId
    });

    const statusCode = error instanceof Error && error.message === 'Video not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update video feature status'
    } as ApiResponse);
  }
};

export const deleteSquad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const squadId = parseInt(req.params.id);
    await adminService.deleteSquad(squadId);

    logger.info('Admin deleted squad', {
      squadId,
      adminId: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Squad deleted successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Admin squad deletion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      squadId: req.params.id,
      adminId: req.user?.userId
    });

    const statusCode = error instanceof Error && error.message === 'Squad not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete squad'
    } as ApiResponse);
  }
};

export const deleteVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    await adminService.deleteVideo(videoId);

    logger.info('Admin deleted video', {
      videoId,
      adminId: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Video deleted successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Admin video deletion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      videoId: req.params.id,
      adminId: req.user?.userId
    });

    const statusCode = error instanceof Error && error.message === 'Video not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete video'
    } as ApiResponse);
  }
};