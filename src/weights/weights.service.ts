import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateWeightDto } from './dto/create-weight.dto';
import { UpdateWeightDto } from './dto/update-weight.dto';

@Injectable()
export class WeightsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(
    userId: number,
    createWeightDto: CreateWeightDto,
    file?: Express.Multer.File,
  ) {
    const { weight, date, notes, photoNotes } = createWeightDto;

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

      // Si se proporciona una foto, subirla
      if (file) {
        try {
          const imageUrls = await this.storageService.uploadImage(
            file,
            userId,
            weightRecord.id,
          );

          const photo = await this.prisma.photo.create({
            data: {
              userId,
              weightId: weightRecord.id,
              notes: photoNotes,
              thumbnailUrl: imageUrls.thumbnailUrl,
              mediumUrl: imageUrls.mediumUrl,
              fullUrl: imageUrls.fullUrl,
            },
          });

          return {
            ...weightRecord,
            photo: {
              id: photo.id,
              userId: photo.userId,
              weightId: photo.weightId,
              thumbnailUrl: photo.thumbnailUrl,
              mediumUrl: photo.mediumUrl,
              fullUrl: photo.fullUrl,
              createdAt: photo.createdAt,
              updatedAt: photo.updatedAt,
            },
            photos: undefined,
          };
        } catch (photoError) {
          // Si falla la subida de foto, eliminar el registro de peso creado
          await this.prisma.weight.delete({
            where: { id: weightRecord.id },
          });
          throw new BadRequestException('Error al subir la foto');
        }
      }

      return {
        ...weightRecord,
        photo: null,
        photos: undefined,
      };
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

    const where: { userId: number; date?: { gte?: Date; lte?: Date } } = {
      userId,
    };

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

    const formattedWeights = weights.map((weight) => ({
      ...weight,
      photo:
        weight.photos
          ? {
              id: weight.photos.id,
              userId: weight.photos.userId,
              weightId: weight.photos.weightId,
              thumbnailUrl: weight.photos.thumbnailUrl,
              mediumUrl: weight.photos.mediumUrl,
              fullUrl: weight.photos.fullUrl,
              createdAt: weight.photos.createdAt,
              updatedAt: weight.photos.updatedAt,
            }
          : null,
      photos: undefined,
    }));

    return {
      data: formattedWeights,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getChartData(userId: number, timeRange: string = '1month', page: number = 0) {
    // Primero obtener la fecha más antigua y más reciente del usuario
    const dateRange = await this.prisma.weight.aggregate({
      where: { userId },
      _min: { date: true },
      _max: { date: true },
    });

    if (!dateRange._min?.date || !dateRange._max?.date) {
      return {
        data: [],
        pagination: {
          currentPeriod: '',
          hasNext: false,
          hasPrevious: false,
          totalPeriods: 0,
          currentPage: 0,
        },
      };
    }

    const oldestDate = dateRange._min.date;
    const newestDate = dateRange._max.date;

    // Calcular el período actual basado en la página
    const { startDate, endDate, periodLabel } = this.calculatePeriodRange(
      timeRange,
      page,
      newestDate,
      oldestDate,
    );

    // Obtener pesos del período actual
    const weights = await this.prisma.weight.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        weight: true,
        date: true,
      },
    });

    // Calcular metadata de navegación
    const totalPeriods = this.calculateTotalPeriods(timeRange, oldestDate, newestDate);
    const hasNext = page < totalPeriods - 1;
    const hasPrevious = page > 0;

    return {
      data: weights.map((weight) => ({
        weight: Number(weight.weight),
        date: weight.date,
      })),
      pagination: {
        currentPeriod: periodLabel,
        hasNext,
        hasPrevious,
        totalPeriods,
        currentPage: page,
      },
    };
  }

  private calculatePeriodRange(
    timeRange: string,
    page: number,
    newestDate: Date,
    oldestDate: Date,
  ) {
    const now = new Date(newestDate);
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    switch (timeRange) {
      case '1week': {
        // Encontrar el inicio de la semana más reciente (domingo)
        const mostRecentSunday = new Date(now);
        mostRecentSunday.setDate(now.getDate() - now.getDay());
        mostRecentSunday.setHours(0, 0, 0, 0);
        
        // Calcular la semana actual basada en la página
        startDate = new Date(mostRecentSunday);
        startDate.setDate(startDate.getDate() - (page * 7));
        
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        
        periodLabel = `Semana del ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()}`;
        break;
      }
      case '1month': {
        // Calcular el mes actual basado en la página
        const targetDate = new Date(now.getFullYear(), now.getMonth() - page, 1);
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        periodLabel = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
        break;
      }
      case '3months': {
        // Calcular trimestre
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        const targetDate = new Date(now.getFullYear(), quarterStartMonth - (page * 3), 1);
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const quarter = Math.floor(targetDate.getMonth() / 3) + 1;
        periodLabel = `Q${quarter} ${targetDate.getFullYear()}`;
        break;
      }
      case '6months': {
        // Calcular semestre
        const semesterStartMonth = Math.floor(now.getMonth() / 6) * 6;
        const targetDate = new Date(now.getFullYear(), semesterStartMonth - (page * 6), 1);
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 6, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const semester = Math.floor(targetDate.getMonth() / 6) + 1;
        periodLabel = `S${semester} ${targetDate.getFullYear()}`;
        break;
      }
      case '1year': {
        // Calcular año
        const targetYear = now.getFullYear() - page;
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
        
        periodLabel = `${targetYear}`;
        break;
      }
      default: {
        // Default a mes actual
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        periodLabel = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
      }
    }

    return { startDate, endDate, periodLabel };
  }

  private calculateTotalPeriods(timeRange: string, oldestDate: Date, newestDate: Date): number {
    const oldest = new Date(oldestDate);
    const newest = new Date(newestDate);
    
    switch (timeRange) {
      case '1week': {
        const diffTime = newest.getTime() - oldest.getTime();
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        return Math.max(1, diffWeeks);
      }
      case '1month': {
        const diffMonths = (newest.getFullYear() - oldest.getFullYear()) * 12 + 
          (newest.getMonth() - oldest.getMonth()) + 1;
        return Math.max(1, diffMonths);
      }
      case '3months': {
        const diffMonths = (newest.getFullYear() - oldest.getFullYear()) * 12 + 
          (newest.getMonth() - oldest.getMonth()) + 1;
        return Math.max(1, Math.ceil(diffMonths / 3));
      }
      case '6months': {
        const diffMonths = (newest.getFullYear() - oldest.getFullYear()) * 12 + 
          (newest.getMonth() - oldest.getMonth()) + 1;
        return Math.max(1, Math.ceil(diffMonths / 6));
      }
      case '1year': {
        const diffYears = newest.getFullYear() - oldest.getFullYear() + 1;
        return Math.max(1, diffYears);
      }
      default:
        return 1;
    }
  }

  async getPaginatedData(userId: number, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;

    const [weights, total] = await Promise.all([
      this.prisma.weight.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          weight: true,
          date: true,
          notes: true,
          photos: {
            select: {
              id: true,
            },
          },
        },
      }),
      this.prisma.weight.count({ where: { userId } }),
    ]);

    const formattedWeights = weights.map((weight) => ({
      id: weight.id,
      weight: Number(weight.weight),
      date: weight.date,
      notes: weight.notes,
      hasPhoto: !!weight.photos,
    }));

    return {
      data: formattedWeights,
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

    return {
      ...weight,
      photo:
        weight.photos
          ? {
              id: weight.photos.id,
              userId: weight.photos.userId,
              weightId: weight.photos.weightId,
              thumbnailUrl: weight.photos.thumbnailUrl,
              mediumUrl: weight.photos.mediumUrl,
              fullUrl: weight.photos.fullUrl,
              createdAt: weight.photos.createdAt,
              updatedAt: weight.photos.updatedAt,
            }
          : null,
      photos: undefined,
    };
  }

  async update(
    id: number,
    userId: number,
    updateWeightDto: UpdateWeightDto,
    file?: Express.Multer.File,
  ) {
    const existingWeight = await this.findOne(id, userId);
    const { photoNotes, ...weightData } = updateWeightDto;

    try {
      // Actualizar el registro de peso
      const updatedWeight = await this.prisma.weight.update({
        where: { id },
        data: {
          ...weightData,
          date: updateWeightDto.date
            ? new Date(updateWeightDto.date)
            : undefined,
        },
        include: {
          photos: true,
        },
      });

      // Si se proporciona una nueva foto
      if (file) {
        // Eliminar foto existente si la hay
        if (existingWeight.photo) {
          await Promise.all([
            this.storageService.deleteImage(existingWeight.photo.thumbnailUrl),
            this.storageService.deleteImage(existingWeight.photo.mediumUrl),
            this.storageService.deleteImage(existingWeight.photo.fullUrl),
          ]);
          await this.prisma.photo.delete({
            where: { id: existingWeight.photo.id },
          });
        }

        // Subir nueva foto
        try {
          const imageUrls = await this.storageService.uploadImage(
            file,
            userId,
            id,
          );

          const photo = await this.prisma.photo.create({
            data: {
              userId,
              weightId: id,
              notes: photoNotes,
              thumbnailUrl: imageUrls.thumbnailUrl,
              mediumUrl: imageUrls.mediumUrl,
              fullUrl: imageUrls.fullUrl,
            },
          });

          return {
            ...updatedWeight,
            photo: {
              id: photo.id,
              userId: photo.userId,
              weightId: photo.weightId,
              thumbnailUrl: photo.thumbnailUrl,
              mediumUrl: photo.mediumUrl,
              fullUrl: photo.fullUrl,
              createdAt: photo.createdAt,
              updatedAt: photo.updatedAt,
            },
            photos: undefined,
          };
        } catch (photoError) {
          throw new BadRequestException('Error al subir la nueva foto');
        }
      }

      // Si solo se actualizan las notas de la foto existente
      if (photoNotes !== undefined && existingWeight.photo) {
        const updatedPhoto = await this.prisma.photo.update({
          where: { id: existingWeight.photo.id },
          data: { notes: photoNotes },
        });

        return {
          ...updatedWeight,
          photo: {
            id: updatedPhoto.id,
            userId: updatedPhoto.userId,
            weightId: updatedPhoto.weightId,
            thumbnailUrl: updatedPhoto.thumbnailUrl,
            mediumUrl: updatedPhoto.mediumUrl,
            fullUrl: updatedPhoto.fullUrl,
            createdAt: updatedPhoto.createdAt,
            updatedAt: updatedPhoto.updatedAt,
          },
          photos: undefined,
        };
      }

      return {
        ...updatedWeight,
        photo:
          updatedWeight.photos
            ? {
                id: updatedWeight.photos.id,
                userId: updatedWeight.photos.userId,
                weightId: updatedWeight.photos.weightId,
                thumbnailUrl: updatedWeight.photos.thumbnailUrl,
                mediumUrl: updatedWeight.photos.mediumUrl,
                fullUrl: updatedWeight.photos.fullUrl,
                createdAt: updatedWeight.photos.createdAt,
                updatedAt: updatedWeight.photos.updatedAt,
              }
            : null,
        photos: undefined,
      };
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

    if (!weight.photo) {
      throw new NotFoundException(
        'Este registro de peso no tiene foto asociada',
      );
    }

    return {
      id: weight.photo.id,
      userId: weight.photo.userId,
      weightId: weight.photo.weightId,
      thumbnailUrl: weight.photo.thumbnailUrl,
      mediumUrl: weight.photo.mediumUrl,
      fullUrl: weight.photo.fullUrl,
      createdAt: weight.photo.createdAt,
      updatedAt: weight.photo.updatedAt,
    };
  }

  async remove(id: number, userId: number) {
    const weight = await this.findOne(id, userId);

    // Eliminar fotos asociadas del storage
    if (weight.photo) {
      await this.storageService.deleteAllImagesForWeight(userId, id);
    }

    // Eliminar el registro de peso (las fotos se eliminan en cascada)
    await this.prisma.weight.delete({
      where: { id },
    });

    return { message: 'Registro de peso eliminado exitosamente' };
  }
}
