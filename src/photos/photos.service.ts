import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async uploadPhoto(userId: number, file: Express.Multer.File, createPhotoDto: CreatePhotoDto) {
    const { weightId, notes } = createPhotoDto;

    // Verify weight exists and belongs to user
    const weight = await this.prisma.weight.findUnique({
      where: { id: weightId },
    });

    if (!weight) {
      throw new NotFoundException('Registro de peso no encontrado');
    }

    if (weight.userId !== userId) {
      throw new ForbiddenException('No tienes permisos para agregar fotos a este registro');
    }

    try {
      // Upload image to storage
      const imageUrls = await this.storageService.uploadImage(file, userId, weightId);

      // Save photo record to database
      const photo = await this.prisma.photo.create({
        data: {
          userId,
          weightId,
          notes,
          thumbnailUrl: imageUrls.thumbnailUrl,
          mediumUrl: imageUrls.mediumUrl,
          fullUrl: imageUrls.fullUrl,
        },
        include: {
          weight: true,
        },
      });

      return photo;
    } catch (error) {
      throw new BadRequestException('Error al subir la foto');
    }
  }

  async findAll(userId: number, page: number = 1, limit: number = 10, weightId?: number) {
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    if (weightId) {
      where.weightId = weightId;
    }

    const [photos, total] = await Promise.all([
      this.prisma.photo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          weight: true,
        },
      }),
      this.prisma.photo.count({ where }),
    ]);

    return {
      data: photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
      include: {
        weight: true,
      },
    });

    if (!photo) {
      throw new NotFoundException('Foto no encontrada');
    }

    if (photo.userId !== userId) {
      throw new ForbiddenException('No tienes permisos para acceder a esta foto');
    }

    return photo;
  }

  async remove(id: number, userId: number) {
    const photo = await this.findOne(id, userId);

    // Delete from storage
    await Promise.all([
      this.storageService.deleteImage(photo.thumbnailUrl),
      this.storageService.deleteImage(photo.mediumUrl),
      this.storageService.deleteImage(photo.fullUrl),
    ]);

    // Delete from database
    await this.prisma.photo.delete({
      where: { id },
    });

    return { message: 'Foto eliminada exitosamente' };
  }
}