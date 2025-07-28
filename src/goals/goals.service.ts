import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createGoalDto: CreateGoalDto) {
    const { targetWeight, targetDate } = createGoalDto;

    // Validate target date is in the future
    const targetDateObj = new Date(targetDate);
    if (targetDateObj <= new Date()) {
      throw new BadRequestException('La fecha objetivo debe ser en el futuro');
    }

    // Check if user already has an active goal
    const existingGoal = await this.prisma.goal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingGoal) {
      throw new BadRequestException(
        'Ya tienes una meta activa. Elimina la actual para crear una nueva.',
      );
    }

    const goal = await this.prisma.goal.create({
      data: {
        userId,
        targetWeight,
        targetDate: targetDateObj,
      },
      select: {
        id: true,
        userId: true,
        targetWeight: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return goal;
  }

  async findOne(id: number, userId: number) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        targetWeight: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!goal) {
      throw new NotFoundException('Meta no encontrada');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a esta meta',
      );
    }

    return goal;
  }

  async update(id: number, userId: number, updateGoalDto: UpdateGoalDto) {
    await this.findOne(id, userId);

    // Validate target date is in the future if provided
    if (updateGoalDto.targetDate) {
      const targetDateObj = new Date(updateGoalDto.targetDate);
      if (targetDateObj <= new Date()) {
        throw new BadRequestException(
          'La fecha objetivo debe ser en el futuro',
        );
      }
    }

    const updatedGoal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...updateGoalDto,
        targetDate: updateGoalDto.targetDate
          ? new Date(updateGoalDto.targetDate)
          : undefined,
      },
      select: {
        id: true,
        userId: true,
        targetWeight: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedGoal;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    await this.prisma.goal.delete({
      where: { id },
    });

    return { message: 'Meta eliminada exitosamente' };
  }
}
