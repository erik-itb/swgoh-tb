import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/swgoh_tb_test'
    }
  }
});

// Setup test database
beforeAll(async () => {
  // Ensure test database is clean
  await prisma.$connect();
});

// Clean up after each test
afterEach(async () => {
  // Clean up all tables in correct order (reverse of foreign key dependencies)
  await prisma.auditLog.deleteMany();
  await prisma.missionRecommendation.deleteMany();
  await prisma.squadUnit.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.combatMission.deleteMany();
  await prisma.planet.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.territoryBattle.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };