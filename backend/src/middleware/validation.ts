import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        logger.debug('Validation error', {
          errors: formattedErrors,
          body: req.body,
          ip: req.ip
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formattedErrors
        });
      }

      logger.error('Unexpected validation error', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: formattedErrors
        });
      }

      logger.error('Unexpected query validation error', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters'
        });
      }

      logger.error('Unexpected params validation error', { error });
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};