import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);

    logger.info('User registered', {
      userId: result.user.id,
      username: result.user.username,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      ip: req.ip
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);

    logger.info('User logged in', {
      userId: result.user.id,
      username: result.user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    } as ApiResponse);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse);
    }

    const user = await authService.getProfile(req.user.userId);

    res.json({
      success: true,
      data: user
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to get profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId
    });

    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get profile'
    } as ApiResponse);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse);
    }

    const user = await authService.updateProfile(req.user.userId, req.body);

    logger.info('Profile updated', {
      userId: req.user.userId,
      changes: Object.keys(req.body)
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Profile update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    } as ApiResponse);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse);
    }

    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.userId, currentPassword, newPassword);

    logger.info('Password changed', { userId: req.user.userId });

    res.json({
      success: true,
      message: 'Password changed successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Password change failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId
    });

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password'
    } as ApiResponse);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      } as ApiResponse);
    }

    const newToken = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: { token: newToken },
      message: 'Token refreshed successfully'
    } as ApiResponse);
  } catch (error) {
    logger.warn('Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh token'
    } as ApiResponse);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  // Client-side logout (token invalidation is handled client-side)
  logger.info('User logged out', { userId: req.user?.userId });

  res.json({
    success: true,
    message: 'Logged out successfully'
  } as ApiResponse);
};