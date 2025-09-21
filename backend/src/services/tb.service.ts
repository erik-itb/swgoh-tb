import { prisma } from '../config/database.js';
import { PaginationParams } from '../types/index.js';

export class TerritoryBattleService {
  async getTerritoryBattles() {
    return await prisma.territoryBattle.findMany({
      where: { isActive: true },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
          include: {
            planets: {
              include: {
                _count: {
                  select: { missions: true }
                }
              }
            }
          }
        }
      }
    });
  }

  async getTerritoryBattleBySlug(slug: string) {
    const tb = await prisma.territoryBattle.findUnique({
      where: { slug },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
          include: {
            planets: {
              include: {
                _count: {
                  select: { missions: true }
                }
              }
            }
          }
        }
      }
    });

    if (!tb) {
      throw new Error('Territory Battle not found');
    }

    return tb;
  }

  async getPhase(phaseId: number) {
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        territoryBattle: true,
        planets: {
          include: {
            missions: {
              include: {
                _count: {
                  select: {
                    recommendations: true,
                    videos: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!phase) {
      throw new Error('Phase not found');
    }

    return phase;
  }

  async getPlanet(planetId: number) {
    const planet = await prisma.planet.findUnique({
      where: { id: planetId },
      include: {
        phase: {
          include: {
            territoryBattle: true
          }
        },
        missions: {
          include: {
            _count: {
              select: {
                recommendations: true,
                videos: true,
                waves: true
              }
            }
          },
          orderBy: [
            { missionType: 'asc' },
            { name: 'asc' }
          ]
        }
      }
    });

    if (!planet) {
      throw new Error('Planet not found');
    }

    return planet;
  }

  async getMission(missionId: number) {
    const mission = await prisma.combatMission.findUnique({
      where: { id: missionId },
      include: {
        planet: {
          include: {
            phase: {
              include: {
                territoryBattle: true
              }
            }
          }
        },
        recommendations: {
          where: { isCurrent: true },
          include: {
            squad: {
              include: {
                units: {
                  include: {
                    unit: true
                  },
                  orderBy: { position: 'asc' }
                }
              }
            },
            submitter: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: { priority: 'asc' }
        },
        waves: {
          orderBy: { waveNumber: 'asc' }
        },
        videos: {
          where: { isActive: true },
          include: {
            submitter: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: [
            { isFeatured: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!mission) {
      throw new Error('Mission not found');
    }

    return mission;
  }

  async getMissionWaves(missionId: number) {
    // Verify mission exists
    const mission = await prisma.combatMission.findUnique({
      where: { id: missionId }
    });

    if (!mission) {
      throw new Error('Mission not found');
    }

    return await prisma.missionWave.findMany({
      where: { missionId },
      orderBy: { waveNumber: 'asc' }
    });
  }

  async getMissionRecommendations(missionId: number, pagination: PaginationParams) {
    // Verify mission exists
    const mission = await prisma.combatMission.findUnique({
      where: { id: missionId }
    });

    if (!mission) {
      throw new Error('Mission not found');
    }

    const [recommendations, total] = await Promise.all([
      prisma.missionSquadRecommendation.findMany({
        where: {
          missionId,
          isCurrent: true
        },
        include: {
          squad: {
            include: {
              units: {
                include: {
                  unit: true
                },
                orderBy: { position: 'asc' }
              }
            }
          },
          submitter: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { priority: 'asc' },
        skip: pagination.offset,
        take: pagination.limit
      }),
      prisma.missionSquadRecommendation.count({
        where: {
          missionId,
          isCurrent: true
        }
      })
    ]);

    return { recommendations, total };
  }

  async getMissionVideos(missionId: number, pagination: PaginationParams) {
    // Verify mission exists
    const mission = await prisma.combatMission.findUnique({
      where: { id: missionId }
    });

    if (!mission) {
      throw new Error('Mission not found');
    }

    const [videos, total] = await Promise.all([
      prisma.strategyVideo.findMany({
        where: {
          missionId,
          isActive: true
        },
        include: {
          submitter: {
            select: {
              id: true,
              username: true
            }
          },
          squad: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: pagination.offset,
        take: pagination.limit
      }),
      prisma.strategyVideo.count({
        where: {
          missionId,
          isActive: true
        }
      })
    ]);

    return { videos, total };
  }
}