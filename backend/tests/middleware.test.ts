import request from 'supertest';
import app from '../src/app';
import { prisma } from './setup';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Middleware Tests', () => {
  let adminToken: string;
  let contributorToken: string;

  beforeEach(async () => {
    // Create test users
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Admin123!', 12),
        role: UserRole.ADMIN
      }
    });

    const contributor = await prisma.user.create({
      data: {
        username: 'contributor',
        email: 'contributor@example.com',
        passwordHash: await bcrypt.hash('Contrib123!', 12),
        role: UserRole.CONTRIBUTOR
      }
    });

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });
    adminToken = adminLogin.body.token;

    const contribLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'contributor', password: 'Contrib123!' });
    contributorToken = contribLogin.body.token;
  });

  describe('Authentication Middleware', () => {
    test('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('admin');
    });
  });

  describe('Authorization Middleware', () => {
    test('should allow admin to access admin routes', async () => {
      const response = await request(app)
        .post('/api/territory-battles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test TB',
          slug: 'test-tb',
          description: 'Test description',
          isActive: true
        });

      expect(response.status).toBe(201);
    });

    test('should reject non-admin from admin routes', async () => {
      const response = await request(app)
        .post('/api/territory-battles')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          name: 'Test TB',
          slug: 'test-tb',
          description: 'Test description',
          isActive: true
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    test('should limit excessive requests', async () => {
      // This test would need to be adjusted based on actual rate limiting configuration
      // For now, we'll test that the middleware is present
      const response = await request(app)
        .get('/api/territory-battles');

      // Rate limiting middleware adds headers
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/territory-battles');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/territory-battles')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Audit Logging', () => {
    test('should log create operations', async () => {
      const initialAuditCount = await prisma.auditLog.count();

      await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          name: 'Test Squad',
          description: 'Test description',
          squadType: 'REBEL',
          units: []
        });

      const finalAuditCount = await prisma.auditLog.count();
      expect(finalAuditCount).toBe(initialAuditCount + 1);

      const auditLog = await prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.action).toBe('CREATE');
      expect(auditLog!.tableName).toBe('Squad');
    });

    test('should log update operations', async () => {
      // Create a squad first
      const squad = await prisma.squad.create({
        data: {
          name: 'Original Squad',
          description: 'Original description',
          squadType: 'REBEL',
          createdById: (await prisma.user.findFirst({ where: { username: 'contributor' } }))!.id
        }
      });

      const initialAuditCount = await prisma.auditLog.count();

      await request(app)
        .put(`/api/squads/${squad.id}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          name: 'Updated Squad',
          description: 'Updated description'
        });

      const finalAuditCount = await prisma.auditLog.count();
      expect(finalAuditCount).toBe(initialAuditCount + 1);

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'UPDATE' },
        orderBy: { createdAt: 'desc' }
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.tableName).toBe('Squad');
      expect(auditLog!.recordId).toBe(squad.id.toString());
    });
  });
});