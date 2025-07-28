import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeightDto } from './dto/create-weight.dto';
import { UpdateWeightDto } from './dto/update-weight.dto';

@Injectable()
export class WeightsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createWeightDto: CreateWeightDto) {
    const { weight, date, notes } = createWeightDto;

    try {
      const weightRecord = await this.prisma.weight.create({
        data: {
          userId,
          weight,
          date: new Date(date),
          notes,
        },
        include: {
          photos: true,
        },
      });

      return weightRecord;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un registro de peso para esta fecha',
        );
      }
      throw error;
    }
  }

  async findAll(
    userId: number,
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: { userId: number; date?: { gte?: Date; lte?: Date } } = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [weights, total] = await Promise.all([
      this.prisma.weight.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          photos: true,
        },
      }),
      this.prisma.weight.count({ where }),
    ]);

    return {
      data: weights,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const weight = await this.prisma.weight.findUnique({
      where: { id },
      include: {
        photos: true,
      },
    });

    if (!weight) {
      throw new NotFoundException('Registro de peso no encontrado');
    }

    if (weight.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este registro',
      );
    }

    return weight;
  }

  async update(id: number, userId: number, updateWeightDto: UpdateWeightDto) {
    await this.findOne(id, userId);

    try {
      const updatedWeight = await this.prisma.weight.update({
        where: { id },
        data: {
          ...updateWeightDto,
          date: updateWeightDto.date
            ? new Date(updateWeightDto.date)
            : undefined,
        },
        include: {
          photos: true,
        },
      });

      return updatedWeight;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un registro de peso para esta fecha',
        );
      }
      throw error;
    }
  }

  async getWeightPhoto(weightId: number, userId: number) {
    const weight = await this.findOne(weightId, userId);
    
    if (!weight.photos || weight.photos.length === 0) {
      throw new NotFoundException('Este registro de peso no tiene foto asociada');
    }

    return weight.photos[0];
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    await this.prisma.weight.delete({
      where: { id },
    });

    return { message: 'Registro de peso eliminado exitosamente' };
  }
}
