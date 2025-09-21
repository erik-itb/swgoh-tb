import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ApiResponse, DatabaseError } from '../types/index.js';

export const errorHandler = (
  error: Error | DatabaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target?.[0] || 'field';
        return res.status(409).json({
          success: false,
          error: `${field} already exists`
        } as ApiResponse);

      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        } as ApiResponse);

      case 'P2003':
        // Foreign key constraint violation
        return res.status(400).json({
          success: false,
          error: 'Invalid reference'
        } as ApiResponse);

      case 'P2014':
        // Invalid ID
        return res.status(400).json({
          success: false,
          error: 'Invalid ID provided'
        } as ApiResponse);

      default:
        return res.status(500).json({
          success: false,
          error: 'Database error'
        } as ApiResponse);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid data provided'
    } as ApiResponse);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    } as ApiResponse);
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    } as ApiResponse);
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  } as ApiResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  } as ApiResponse);
};