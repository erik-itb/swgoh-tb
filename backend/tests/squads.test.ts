import request from 'supertest';
import app from '../src/app';
import { prisma } from './setup';
import { UserRole, SquadType } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Squads API', () => {
  let contributorToken: string;
  let adminToken: string;
  let userToken: string;
  let contributorId: number;
  let adminId: number;

  beforeEach(async () => {
    // Create users
    const contributor = await prisma.user.create({
      data: {
        username: 'contributor',
        email: 'contributor@example.com',
        passwordHash: await bcrypt.hash('Contrib123!', 12),
        role: UserRole.CONTRIBUTOR
      }
    });
    contributorId = contributor.id;

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Admin123!', 12),
        role: UserRole.ADMIN
      }
    });
    adminId = admin.id;

    await prisma.user.create({
      data: {
        username: 'user',
        email: 'user@example.com',
        passwordHash: await bcrypt.hash('User123!', 12),
        role: UserRole.VIEWER
      }
    });

    // Get tokens
    const contribLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'contributor', password: 'Contrib123!' });
    contributorToken = contribLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user', password: 'User123!' });
    userToken = userLogin.body.token;
  });

  describe('POST /api/squads', () => {
    const squadData = {
      name: '501st Clone Troopers',
      description: 'Elite clone trooper squad',
      squadType: SquadType.CLONE_TROOPERS,
      units: [
        {
          name: 'Clone Commander Rex',
          position: 'leader',
          requiredRelicLevel: 7,
          requiredStars: 7,
          requiredGearLevel: 13,
          modRecommendation: 'Speed/Health sets',
          zetaRecommendations: ['Leader ability', 'Unique ability']
        },
        {
          name: 'ARC Trooper Echo',
          position: 'tank',
          requiredRelicLevel: 5,
          requiredStars: 7,
          requiredGearLevel: 13
        }
      ]
    };

    test('should create squad as contributor', async () => {
      const response = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send(squadData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(squadData.name);
      expect(response.body.createdById).toBe(contributorId);
      expect(response.body.units).toHaveLength(2);
      expect(response.body.units[0].name).toBe('Clone Commander Rex');
    });

    test('should reject squad creation by viewer', async () => {
      const response = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${userToken}`)
        .send(squadData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid squad data', async () => {
      const response = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/squads', () => {
    beforeEach(async () => {
      // Create test squads
      await prisma.squad.createMany({
        data: [
          {
            name: 'Published Squad',
            description: 'A published squad',
            squadType: SquadType.JEDI,
            isPublished: true,
            createdById: contributorId
          },
          {
            name: 'Draft Squad',
            description: 'A draft squad',
            squadType: SquadType.SITH,
            isPublished: false,
            createdById: contributorId
          }
        ]
      });
    });

    test('should get published squads for unauthenticated users', async () => {
      const response = await request(app)
        .get('/api/squads');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Published Squad');
    });

    test('should get all squads for contributor (including drafts)', async () => {
      const response = await request(app)
        .get('/api/squads')
        .set('Authorization', `Bearer ${contributorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('should filter by squad type', async () => {
      const response = await request(app)
        .get('/api/squads?type=JEDI')
        .set('Authorization', `Bearer ${contributorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].squadType).toBe('JEDI');
    });

    test('should search by name', async () => {
      const response = await request(app)
        .get('/api/squads?search=Published')
        .set('Authorization', `Bearer ${contributorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Published Squad');
    });
  });

  describe('GET /api/squads/:id', () => {
    let squadId: number;

    beforeEach(async () => {
      const squad = await prisma.squad.create({
        data: {
          name: 'Test Squad',
          description: 'Test description',
          squadType: SquadType.REBEL,
          isPublished: true,
          createdById: contributorId,
          units: {
            create: [
              {
                name: 'Luke Skywalker',
                position: 'leader',
                requiredRelicLevel: 7
              }
            ]
          }
        }
      });
      squadId = squad.id;
    });

    test('should get squad by id with units', async () => {
      const response = await request(app)
        .get(`/api/squads/${squadId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Squad');
      expect(response.body.units).toHaveLength(1);
      expect(response.body.units[0].name).toBe('Luke Skywalker');
    });

    test('should return 404 for non-existent squad', async () => {
      const response = await request(app)
        .get('/api/squads/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/squads/:id', () => {
    let squadId: number;

    beforeEach(async () => {
      const squad = await prisma.squad.create({
        data: {
          name: 'Original Squad',
          description: 'Original description',
          squadType: SquadType.EMPIRE,
          createdById: contributorId
        }
      });
      squadId = squad.id;
    });

    test('should update own squad as contributor', async () => {
      const updateData = {
        name: 'Updated Squad',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/squads/${squadId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    test('should reject update by non-owner', async () => {
      const response = await request(app)
        .put(`/api/squads/${squadId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked Squad' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should allow admin to update any squad', async () => {
      const response = await request(app)
        .put(`/api/squads/${squadId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/squads/:id', () => {
    let squadId: number;

    beforeEach(async () => {
      const squad = await prisma.squad.create({
        data: {
          name: 'Squad to Delete',
          description: 'Will be deleted',
          squadType: SquadType.FIRST_ORDER,
          createdById: contributorId
        }
      });
      squadId = squad.id;
    });

    test('should delete own squad as contributor', async () => {
      const response = await request(app)
        .delete(`/api/squads/${squadId}`)
        .set('Authorization', `Bearer ${contributorToken}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const squadExists = await prisma.squad.findUnique({
        where: { id: squadId }
      });
      expect(squadExists).toBeNull();
    });

    test('should reject deletion by non-owner', async () => {
      const response = await request(app)
        .delete(`/api/squads/${squadId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/squads/:id/publish', () => {
    let squadId: number;

    beforeEach(async () => {
      const squad = await prisma.squad.create({
        data: {
          name: 'Draft Squad',
          description: 'Ready to publish',
          squadType: SquadType.RESISTANCE,
          isPublished: false,
          createdById: contributorId
        }
      });
      squadId = squad.id;
    });

    test('should publish squad as contributor', async () => {
      const response = await request(app)
        .post(`/api/squads/${squadId}/publish`)
        .set('Authorization', `Bearer ${contributorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isPublished).toBe(true);
    });

    test('should reject publish by viewer', async () => {
      const response = await request(app)
        .post(`/api/squads/${squadId}/publish`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});