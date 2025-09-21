import { prisma } from '../config/database.js';
import { UserRole } from '@prisma/client';
import { PaginationParams } from '../types/index.js';

export interface AdminUserUpdate {
  role?: UserRole;
  isActive?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalSquads: number;
  totalMissions: number;
  totalRecommendations: number;
  totalVideos: number;
  recentActivity: {
    newUsers: number;
    newSquads: number;
    newRecommendations: number;
  };
  usersByRole: {
    [key in UserRole]: number;
  };
}

export class AdminService {
  async getUsers(pagination: PaginationParams) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              createdSquads: true,
              submittedRecommendations: true,
              submittedVideos: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.offset,
        take: pagination.limit
      }),
      prisma.user.count()
    ]);

    return { users, total };
  }

  async updateUser(userId: number, updates: AdminUserUpdate) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });

    return updatedUser;
  }

  async getAuditLogs(pagination: PaginationParams) {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.offset,
        take: pagination.limit
      }),
      prisma.auditLog.count()
    ]);

    return { logs, total };
  }

  async getSystemStats(): Promise<AdminStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalSquads,
      totalMissions,
      totalRecommendations,
      totalVideos,
      newUsers,
      newSquads,
      newRecommendations,
      usersByRole
    ] = await Promise.all([
      prisma.user.count(),
      prisma.squad.count(),
      prisma.combatMission.count(),
      prisma.missionSquadRecommendation.count(),
      prisma.strategyVideo.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.squad.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.missionSquadRecommendation.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      })
    ]);

    const roleStats = Object.values(UserRole).reduce((acc, role) => {
      acc[role] = usersByRole.find(r => r.role === role)?._count.role || 0;
      return acc;
    }, {} as { [key in UserRole]: number });

    return {
      totalUsers,
      totalSquads,
      totalMissions,
      totalRecommendations,
      totalVideos,
      recentActivity: {
        newUsers,
        newSquads,
        newRecommendations
      },
      usersByRole: roleStats
    };
  }

  async approveRecommendation(recommendationId: number, adminId: number) {
    const recommendation = await prisma.missionSquadRecommendation.findUnique({
      where: { id: recommendationId }
    });

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    return await prisma.missionSquadRecommendation.update({
      where: { id: recommendationId },
      data: {
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });
  }

  async approveVideo(videoId: number, adminId: number) {
    const video = await prisma.strategyVideo.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      throw new Error('Video not found');
    }

    return await prisma.strategyVideo.update({
      where: { id: videoId },
      data: {
        approvedBy: adminId,
        isActive: true
      }
    });
  }

  async featureVideo(videoId: number, featured: boolean) {
    const video = await prisma.strategyVideo.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      throw new Error('Video not found');
    }

    return await prisma.strategyVideo.update({
      where: { id: videoId },
      data: { isFeatured: featured }
    });
  }

  async deleteSquad(squadId: number) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId }
    });

    if (!squad) {
      throw new Error('Squad not found');
    }

    await prisma.squad.delete({
      where: { id: squadId }
    });
  }

  async deleteVideo(videoId: number) {
    const video = await prisma.strategyVideo.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      throw new Error('Video not found');
    }

    await prisma.strategyVideo.delete({
      where: { id: videoId }
    });
  }
}