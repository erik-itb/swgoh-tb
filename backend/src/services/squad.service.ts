import { prisma } from '../config/database.js';
import { PaginationParams } from '../types/index.js';
import { SquadType } from '@prisma/client';

export interface CreateSquadData {
  name: string;
  description?: string;
  squadType?: SquadType;
  strategyNotes?: string;
  minPowerRequirement?: number;
  recommendedGearTier?: number;
  recommendedRelicLevel?: number;
}

export interface UpdateSquadData extends Partial<CreateSquadData> {}

export interface SquadQueryParams extends PaginationParams {
  squadType?: SquadType;
  published?: boolean;
  search?: string;
}

export interface AddSquadUnitData {
  unitId: number;
  position?: number;
  isLeader?: boolean;
  isRequired?: boolean;
  notes?: string;
}

export class SquadService {
  async getSquads(params: SquadQueryParams) {
    const { page, limit, offset, squadType, published, search } = params;

    const where: any = {};

    if (squadType) {
      where.squadType = squadType;
    }

    if (published !== undefined) {
      where.isPublished = published;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [squads, total] = await Promise.all([
      prisma.squad.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true
            }
          },
          units: {
            include: {
              unit: true
            },
            orderBy: { position: 'asc' }
          },
          _count: {
            select: {
              recommendations: true
            }
          }
        },
        orderBy: [
          { isPublished: 'desc' },
          { updatedAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.squad.count({ where })
    ]);

    return { squads, total };
  }

  async getSquadById(squadId: number) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        units: {
          include: {
            unit: true
          },
          orderBy: { position: 'asc' }
        },
        recommendations: {
          where: { isCurrent: true },
          include: {
            mission: {
              include: {
                planet: {
                  include: {
                    phase: {
                      include: {
                        territoryBattle: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { priority: 'asc' }
        },
        videos: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!squad) {
      throw new Error('Squad not found');
    }

    return squad;
  }

  async createSquad(userId: number, data: CreateSquadData) {
    const slug = this.generateSlug(data.name);

    const squad = await prisma.squad.create({
      data: {
        ...data,
        slug,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    return squad;
  }

  async updateSquad(squadId: number, userId: number, data: UpdateSquadData) {
    // Check if squad exists and user has permission
    const existingSquad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        creator: true
      }
    });

    if (!existingSquad) {
      throw new Error('Squad not found');
    }

    // Only creator or admin can update
    if (existingSquad.createdBy !== userId) {
      throw new Error('Permission denied');
    }

    const updateData: any = { ...data };

    // Generate new slug if name changed
    if (data.name && data.name !== existingSquad.name) {
      updateData.slug = this.generateSlug(data.name);
    }

    const squad = await prisma.squad.update({
      where: { id: squadId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        units: {
          include: {
            unit: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    return squad;
  }

  async deleteSquad(squadId: number, userId: number) {
    // Check if squad exists and user has permission
    const existingSquad = await prisma.squad.findUnique({
      where: { id: squadId }
    });

    if (!existingSquad) {
      throw new Error('Squad not found');
    }

    if (existingSquad.createdBy !== userId) {
      throw new Error('Permission denied');
    }

    await prisma.squad.delete({
      where: { id: squadId }
    });
  }

  async addUnitToSquad(squadId: number, userId: number, data: AddSquadUnitData) {
    // Check if squad exists and user has permission
    const squad = await prisma.squad.findUnique({
      where: { id: squadId }
    });

    if (!squad) {
      throw new Error('Squad not found');
    }

    if (squad.createdBy !== userId) {
      throw new Error('Permission denied');
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId }
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    // Check if unit already in squad
    const existingSquadUnit = await prisma.squadUnit.findUnique({
      where: {
        squadId_unitId: {
          squadId,
          unitId: data.unitId
        }
      }
    });

    if (existingSquadUnit) {
      throw new Error('Unit already in squad');
    }

    // If position specified, check if it's available
    if (data.position) {
      const positionTaken = await prisma.squadUnit.findUnique({
        where: {
          squadId_position: {
            squadId,
            position: data.position
          }
        }
      });

      if (positionTaken) {
        throw new Error('Position already taken');
      }
    }

    const squadUnit = await prisma.squadUnit.create({
      data: {
        squadId,
        ...data
      },
      include: {
        unit: true
      }
    });

    return squadUnit;
  }

  async removeUnitFromSquad(squadId: number, unitId: number, userId: number) {
    // Check if squad exists and user has permission
    const squad = await prisma.squad.findUnique({
      where: { id: squadId }
    });

    if (!squad) {
      throw new Error('Squad not found');
    }

    if (squad.createdBy !== userId) {
      throw new Error('Permission denied');
    }

    // Check if unit is in squad
    const squadUnit = await prisma.squadUnit.findUnique({
      where: {
        squadId_unitId: {
          squadId,
          unitId
        }
      }
    });

    if (!squadUnit) {
      throw new Error('Unit not in squad');
    }

    await prisma.squadUnit.delete({
      where: {
        squadId_unitId: {
          squadId,
          unitId
        }
      }
    });
  }

  async publishSquad(squadId: number, userId: number) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId }
    });

    if (!squad) {
      throw new Error('Squad not found');
    }

    if (squad.createdBy !== userId) {
      throw new Error('Permission denied');
    }

    return await prisma.squad.update({
      where: { id: squadId },
      data: { isPublished: true }
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}