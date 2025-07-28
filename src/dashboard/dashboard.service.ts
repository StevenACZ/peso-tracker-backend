import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    const weights = await this.prisma.weight.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      select: {
        weight: true,
        date: true,
      },
    });

    const activeGoal = await this.prisma.goal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        targetWeight: true,
        targetDate: true,
        createdAt: true,
      },
    });

    const totalRecords = weights.length;
    const initialWeight = weights.length > 0 ? weights[0].weight : null;
    const currentWeight =
      weights.length > 0 ? weights[weights.length - 1].weight : null;

    let totalChange: number | null = null;
    let weeklyAverage: number | null = null;

    if (initialWeight && currentWeight) {
      totalChange = Number(currentWeight) - Number(initialWeight);

      if (weights.length >= 2) {
        const firstDate = new Date(weights[0].date);
        const lastDate = new Date(weights[weights.length - 1].date);
        const daysDiff = Math.max(
          1,
          (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const weeksDiff = daysDiff / 7;
        weeklyAverage = totalChange / weeksDiff;
      }
    }

    return {
      user,
      statistics: {
        initialWeight: initialWeight ? Number(initialWeight) : null,
        currentWeight: currentWeight ? Number(currentWeight) : null,
        totalChange,
        weeklyAverage,
        totalRecords,
      },
      activeGoal: activeGoal
        ? {
            id: activeGoal.id,
            targetWeight: Number(activeGoal.targetWeight),
            targetDate: activeGoal.targetDate,
            createdAt: activeGoal.createdAt,
          }
        : null,
    };
  }
}
