import request from 'supertest';
import app from '../src/app';
import { prisma } from './setup';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Territory Battles API', () => {
  let adminToken: string;
  let userToken: string;
  let territoryBattleId: number;

  beforeEach(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Admin123!', 12),
        role: UserRole.ADMIN
      }
    });

    // Create regular user
    const regularUser = await prisma.user.create({
      data: {
        username: 'user',
        email: 'user@example.com',
        passwordHash: await bcrypt.hash('User123!', 12),
        role: UserRole.VIEWER
      }
    });

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user', password: 'User123!' });
    userToken = userLogin.body.token;

    // Create test TB
    const tb = await prisma.territoryBattle.create({
      data: {
        name: 'Rise of the Empire',
        slug: 'rise-of-the-empire',
        description: 'Test TB',
        isActive: true
      }
    });
    territoryBattleId = tb.id;
  });

  describe('GET /api/territory-battles', () => {
    test('should get all territory battles', async () => {
      const response = await request(app)
        .get('/api/territory-battles')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'Rise of the Empire',
        slug: 'rise-of-the-empire',
        isActive: true
      });
    });

    test('should work without authentication for public data', async () => {
      const response = await request(app)
        .get('/api/territory-battles');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /api/territory-battles/:slug', () => {
    beforeEach(async () => {
      // Add phases and planets for detailed view
      const phase = await prisma.phase.create({
        data: {
          territoryBattleId,
          name: 'Phase 1',
          description: 'First phase',
          phaseNumber: 1,
          difficultyLevel: 'Relic 5+',
          starRequirement: 1
        }
      });

      await prisma.planet.create({
        data: {
          phaseId: phase.id,
          name: 'Geonosis',
          description: 'Desert planet',
          territory: 'Middle',
          starRequirement: 2
        }
      });
    });

    test('should get territory battle by slug with phases', async () => {
      const response = await request(app)
        .get('/api/territory-battles/rise-of-the-empire')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.slug).toBe('rise-of-the-empire');
      expect(response.body.phases).toHaveLength(1);
      expect(response.body.phases[0].planets).toHaveLength(1);
    });

    test('should return 404 for non-existent TB', async () => {
      const response = await request(app)
        .get('/api/territory-battles/non-existent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/territory-battles', () => {
    const newTB = {
      name: 'Clone Wars',
      slug: 'clone-wars',
      description: 'Clone Wars Territory Battle',
      isActive: false
    };

    test('should create TB as admin', async () => {
      const response = await request(app)
        .post('/api/territory-battles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTB);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newTB);
    });

    test('should reject creation by non-admin', async () => {
      const response = await request(app)
        .post('/api/territory-battles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newTB);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid data', async () => {
      const response = await request(app)
        .post('/api/territory-battles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/territory-battles/:id', () => {
    const updateData = {
      name: 'Updated TB Name',
      description: 'Updated description'
    };

    test('should update TB as admin', async () => {
      const response = await request(app)
        .put(`/api/territory-battles/${territoryBattleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    test('should reject update by non-admin', async () => {
      const response = await request(app)
        .put(`/api/territory-battles/${territoryBattleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/territory-battles/:id', () => {
    test('should delete TB as admin', async () => {
      const response = await request(app)
        .delete(`/api/territory-battles/${territoryBattleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const tbExists = await prisma.territoryBattle.findUnique({
        where: { id: territoryBattleId }
      });
      expect(tbExists).toBeNull();
    });

    test('should reject deletion by non-admin', async () => {
      const response = await request(app)
        .delete(`/api/territory-battles/${territoryBattleId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});