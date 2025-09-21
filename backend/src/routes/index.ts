import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tbRoutes from './tb.routes.js';
import squadRoutes from './squad.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/tb', tbRoutes);
router.use('/squads', squadRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SWGOH Rise of the Empire TB API',
    version: '1.0.0',
    documentation: 'https://github.com/your-repo/api-docs',
    endpoints: {
      auth: '/api/auth',
      territoryBattles: '/api/tb',
      squads: '/api/squads',
      admin: '/api/admin'
    }
  });
});

export default router;