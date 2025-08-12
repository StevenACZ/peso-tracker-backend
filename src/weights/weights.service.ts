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
    cloudflareHeaders?: Record<string, string>,
  ) {
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
              thumbnailUrl: imageUrls.thumbnailUrl,
              mediumUrl: imageUrls.mediumUrl,
              fullUrl: imageUrls.fullUrl,
            },
          });

          // SECURITY: Always return signed URLs for photo access
          const signedUrls = await this.storageService.getSignedUrlsForPhoto(
            {
              thumbnailUrl: photo.thumbnailUrl,
              mediumUrl: photo.mediumUrl,
              fullUrl: photo.fullUrl,
            },
            userId,
            cloudflareHeaders,
          );

          return {
            ...weightRecord,
            photo: {
              id: photo.id,
              userId: photo.userId,
              weightId: photo.weightId,
              thumbnailUrl: signedUrls.thumbnailUrl,
              mediumUrl: signedUrls.mediumUrl,
              fullUrl: signedUrls.fullUrl,
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
    limit: number = 5, // Mobile-first: smaller chunks for better performance
    startDate?: string,
    endDate?: string,
    cloudflareHeaders?: Record<string, string>,
  ) {
    // Enforce maximum limit of 5 to protect app design
    const safeLimit = Math.min(limit, 5);
    const skip = (page - 1) * safeLimit;

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
        take: safeLimit,
        orderBy: { date: 'desc' },
        include: {
          photos: true,
        },
      }),
      this.prisma.weight.count({ where }),
    ]);

    const formattedWeights = await Promise.all(
      weights.map(async (weight) => {
        let photo: {
          id: number;
          userId: number;
          weightId: number;
          thumbnailUrl: string;
          mediumUrl: string;
          fullUrl: string;
          createdAt: Date;
          updatedAt: Date;
          expiresIn?: number;
          format?: string;
        } | null = null;

        if (weight.photos) {
          const signedUrlsResult =
            await this.storageService.getSignedUrlsForPhoto(
              {
                thumbnailUrl: weight.photos.thumbnailUrl,
                mediumUrl: weight.photos.mediumUrl,
                fullUrl: weight.photos.fullUrl,
              },
              userId,
              cloudflareHeaders,
            );

          photo = {
            id: weight.photos.id,
            userId: weight.photos.userId,
            weightId: weight.photos.weightId,
            thumbnailUrl: signedUrlsResult.thumbnailUrl,
            mediumUrl: signedUrlsResult.mediumUrl,
            fullUrl: signedUrlsResult.fullUrl,
            createdAt: weight.photos.createdAt,
            updatedAt: weight.photos.updatedAt,
            expiresIn: signedUrlsResult.expiresIn,
            format: signedUrlsResult.metadata.format,
          };
        }
        return {
          ...weight,
          photo,
          photos: undefined,
        };
      }),
    );

    // Apple-optimized pagination metadata
    const isCloudflare = !!(
      cloudflareHeaders?.['cf-ray'] || cloudflareHeaders?.['cf-connecting-ip']
    );

    return {
      data: formattedWeights,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNext: page < Math.ceil(total / safeLimit),
        hasPrev: page > 1,
      },
      metadata: {
        isCloudflare,
        optimizedForMobile: true,
        dataCount: formattedWeights.length,
        photosCount: formattedWeights.filter((w) => w.photo).length,
      },
    };
  }

  async getChartData(
    userId: number,
    timeRange: string = '1month',
    page: number = 0,
  ) {
    // Si es 'all', devolver todos los datos (mínimo 2 para crear gráfico)
    if (timeRange === 'all') {
      const weights = await this.prisma.weight.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        select: {
          weight: true,
          date: true,
        },
      });

      // Si hay menos de 2 registros, no se puede crear un gráfico
      if (weights.length < 2) {
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

      return {
        data: weights.map((weight) => ({
          weight: Number(weight.weight),
          date: weight.date,
        })),
        pagination: {
          currentPeriod: 'Todos los registros',
          hasNext: false,
          hasPrevious: false,
          totalPeriods: 1,
          currentPage: 0,
        },
      };
    }

    // Obtener períodos que tienen datos
    const periodsWithData = await this.getPeriodsWithData(userId, timeRange);

    if (periodsWithData.length === 0) {
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

    // Verificar que la página solicitada existe
    if (page >= periodsWithData.length) {
      page = periodsWithData.length - 1;
    }

    const currentPeriod = periodsWithData[page];

    // Obtener pesos del período actual
    const weights = await this.prisma.weight.findMany({
      where: {
        userId,
        date: {
          gte: currentPeriod.startDate,
          lte: currentPeriod.endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        weight: true,
        date: true,
      },
    });

    return {
      data: weights.map((weight) => ({
        weight: Number(weight.weight),
        date: weight.date,
      })),
      pagination: {
        currentPeriod: currentPeriod.label,
        hasNext: page < periodsWithData.length - 1,
        hasPrevious: page > 0,
        totalPeriods: periodsWithData.length,
        currentPage: page,
      },
    };
  }

  private async getPeriodsWithData(userId: number, timeRange: string) {
    // Obtener todas las fechas únicas de los pesos del usuario
    const weights = await this.prisma.weight.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    if (weights.length < 2) {
      return [];
    }

    const periodCounts = new Map<
      string,
      { startDate: Date; endDate: Date; label: string; count: number }
    >();

    // Agrupar fechas por período según el timeRange y contar registros
    for (const weight of weights) {
      const date = new Date(weight.date);
      let periodKey: string;
      let startDate: Date;
      let endDate: Date;
      let label: string;

      switch (timeRange) {
        case '1month': {
          periodKey = `${date.getFullYear()}-${date.getMonth()}`;
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);

          const monthNames = [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre',
          ];
          label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          break;
        }
        case '3months': {
          const quarter = Math.floor(date.getMonth() / 3);
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          startDate = new Date(date.getFullYear(), quarter * 3, 1);
          endDate = new Date(date.getFullYear(), quarter * 3 + 3, 0);
          endDate.setHours(23, 59, 59, 999);

          label = `Q${quarter + 1} ${date.getFullYear()}`;
          break;
        }
        case '6months': {
          const semester = Math.floor(date.getMonth() / 6);
          periodKey = `${date.getFullYear()}-S${semester}`;
          startDate = new Date(date.getFullYear(), semester * 6, 1);
          endDate = new Date(date.getFullYear(), semester * 6 + 6, 0);
          endDate.setHours(23, 59, 59, 999);

          label = `S${semester + 1} ${date.getFullYear()}`;
          break;
        }
        case '1year': {
          periodKey = `${date.getFullYear()}`;
          startDate = new Date(date.getFullYear(), 0, 1);
          endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

          label = `${date.getFullYear()}`;
          break;
        }
        default:
          continue;
      }

      if (!periodCounts.has(periodKey)) {
        periodCounts.set(periodKey, { startDate, endDate, label, count: 0 });
      }
      periodCounts.get(periodKey)!.count++;
    }

    // Filtrar períodos que tienen al menos 2 registros
    const validPeriods = Array.from(periodCounts.values())
      .filter((period) => period.count >= 2)
      .map(({ startDate, endDate, label }) => ({ startDate, endDate, label }));

    // Ordenar por fecha (más reciente primero)
    return validPeriods.sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
    );
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
      case '1month': {
        // Calcular el mes actual basado en la página
        const targetDate = new Date(
          now.getFullYear(),
          now.getMonth() - page,
          1,
        );
        startDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          1,
        );
        endDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 1,
          0,
        );
        endDate.setHours(23, 59, 59, 999);

        const monthNames = [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ];
        periodLabel = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
        break;
      }
      case '3months': {
        // Calcular trimestre
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        const targetDate = new Date(
          now.getFullYear(),
          quarterStartMonth - page * 3,
          1,
        );
        startDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          1,
        );
        endDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 3,
          0,
        );
        endDate.setHours(23, 59, 59, 999);

        const quarter = Math.floor(targetDate.getMonth() / 3) + 1;
        periodLabel = `Q${quarter} ${targetDate.getFullYear()}`;
        break;
      }
      case '6months': {
        // Calcular semestre
        const semesterStartMonth = Math.floor(now.getMonth() / 6) * 6;
        const targetDate = new Date(
          now.getFullYear(),
          semesterStartMonth - page * 6,
          1,
        );
        startDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          1,
        );
        endDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 6,
          0,
        );
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

        const monthNames = [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ];
        periodLabel = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
      }
    }

    return { startDate, endDate, periodLabel };
  }

  private calculateTotalPeriods(
    timeRange: string,
    oldestDate: Date,
    newestDate: Date,
  ): number {
    const oldest = new Date(oldestDate);
    const newest = new Date(newestDate);

    switch (timeRange) {
      case '1month': {
        const diffMonths =
          (newest.getFullYear() - oldest.getFullYear()) * 12 +
          (newest.getMonth() - oldest.getMonth()) +
          1;
        return Math.max(1, diffMonths);
      }
      case '3months': {
        const diffMonths =
          (newest.getFullYear() - oldest.getFullYear()) * 12 +
          (newest.getMonth() - oldest.getMonth()) +
          1;
        return Math.max(1, Math.ceil(diffMonths / 3));
      }
      case '6months': {
        const diffMonths =
          (newest.getFullYear() - oldest.getFullYear()) * 12 +
          (newest.getMonth() - oldest.getMonth()) +
          1;
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

  async getWeightProgress(
    userId: number,
    cloudflareHeaders?: Record<string, string>,
  ) {
    const weights = await this.prisma.weight.findMany({
      where: {
        userId,
        photos: {
          isNot: null, // Solo pesos que tienen fotos asociadas
        },
      },
      orderBy: { date: 'asc' }, // Ordenar desde el más antiguo al más reciente
      include: {
        photos: true,
      },
    });

    return Promise.all(
      weights.map(async (weight) => {
        const signedUrlsResult =
          await this.storageService.getSignedUrlsForPhoto(
            {
              thumbnailUrl: weight.photos!.thumbnailUrl,
              mediumUrl: weight.photos!.mediumUrl,
              fullUrl: weight.photos!.fullUrl,
            },
            userId,
            cloudflareHeaders,
          );
        return {
          id: weight.id,
          weight: Number(weight.weight),
          date: weight.date,
          notes: weight.notes,
          photo: {
            id: weight.photos!.id,
            userId: weight.photos!.userId,
            weightId: weight.photos!.weightId,
            thumbnailUrl: signedUrlsResult.thumbnailUrl,
            mediumUrl: signedUrlsResult.mediumUrl,
            fullUrl: signedUrlsResult.fullUrl,
            createdAt: weight.photos!.createdAt,
            updatedAt: weight.photos!.updatedAt,
            expiresIn: signedUrlsResult.expiresIn,
            format: signedUrlsResult.metadata.format,
          },
        };
      }),
    );
  }

  async getPaginatedData(userId: number, page: number = 1, limit: number = 5) {
    // Enforce maximum limit of 5 to protect app design
    const safeLimit = Math.min(limit, 5);
    const skip = (page - 1) * safeLimit;

    const [weights, total] = await Promise.all([
      this.prisma.weight.findMany({
        where: { userId },
        skip,
        take: safeLimit,
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
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  private async findOneRaw(id: number, userId: number) {
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
      photo: weight.photos || null,
      photos: undefined,
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

    let photo: {
      id: number;
      userId: number;
      weightId: number;
      thumbnailUrl: string;
      mediumUrl: string;
      fullUrl: string;
      createdAt: Date;
      updatedAt: Date;
    } | null = null;
    if (weight.photos) {
      const signedUrls = await this.storageService.getSignedUrlsForPhoto(
        {
          thumbnailUrl: weight.photos.thumbnailUrl,
          mediumUrl: weight.photos.mediumUrl,
          fullUrl: weight.photos.fullUrl,
        },
        userId,
      );
      photo = {
        id: weight.photos.id,
        userId: weight.photos.userId,
        weightId: weight.photos.weightId,
        thumbnailUrl: signedUrls.thumbnailUrl,
        mediumUrl: signedUrls.mediumUrl,
        fullUrl: signedUrls.fullUrl,
        createdAt: weight.photos.createdAt,
        updatedAt: weight.photos.updatedAt,
      };
    }

    return {
      ...weight,
      photo,
      photos: undefined,
    };
  }

  async update(
    id: number,
    userId: number,
    updateWeightDto: UpdateWeightDto,
    file?: Express.Multer.File,
    cloudflareHeaders?: Record<string, string>,
  ) {
    const existingWeight = await this.findOneRaw(id, userId);
    const { ...weightData } = updateWeightDto;

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
              thumbnailUrl: imageUrls.thumbnailUrl,
              mediumUrl: imageUrls.mediumUrl,
              fullUrl: imageUrls.fullUrl,
            },
          });

          // SECURITY: Always return signed URLs for photo access
          const signedUrls = await this.storageService.getSignedUrlsForPhoto(
            {
              thumbnailUrl: photo.thumbnailUrl,
              mediumUrl: photo.mediumUrl,
              fullUrl: photo.fullUrl,
            },
            userId,
            cloudflareHeaders,
          );

          return {
            ...updatedWeight,
            photo: {
              id: photo.id,
              userId: photo.userId,
              weightId: photo.weightId,
              thumbnailUrl: signedUrls.thumbnailUrl,
              mediumUrl: signedUrls.mediumUrl,
              fullUrl: signedUrls.fullUrl,
              createdAt: photo.createdAt,
              updatedAt: photo.updatedAt,
            },
            photos: undefined,
          };
        } catch (photoError) {
          throw new BadRequestException('Error al subir la nueva foto');
        }
      }

      // Photo handling removed - only weight notes supported

      let photo: {
        id: number;
        userId: number;
        weightId: number;
        thumbnailUrl: string;
        mediumUrl: string;
        fullUrl: string;
        createdAt: Date;
        updatedAt: Date;
      } | null = null;
      if (updatedWeight.photos) {
        const signedUrls = await this.storageService.getSignedUrlsForPhoto(
          {
            thumbnailUrl: updatedWeight.photos.thumbnailUrl,
            mediumUrl: updatedWeight.photos.mediumUrl,
            fullUrl: updatedWeight.photos.fullUrl,
          },
          userId,
          cloudflareHeaders,
        );
        photo = {
          id: updatedWeight.photos.id,
          userId: updatedWeight.photos.userId,
          weightId: updatedWeight.photos.weightId,
          thumbnailUrl: signedUrls.thumbnailUrl,
          mediumUrl: signedUrls.mediumUrl,
          fullUrl: signedUrls.fullUrl,
          createdAt: updatedWeight.photos.createdAt,
          updatedAt: updatedWeight.photos.updatedAt,
        };
      }
      return {
        ...updatedWeight,
        photo,
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
    const weight = await this.findOneRaw(weightId, userId);

    if (!weight.photo) {
      throw new NotFoundException(
        'Este registro de peso no tiene foto asociada',
      );
    }

    const signedUrls = await this.storageService.getSignedUrlsForPhoto(
      {
        thumbnailUrl: weight.photo.thumbnailUrl,
        mediumUrl: weight.photo.mediumUrl,
        fullUrl: weight.photo.fullUrl,
      },
      userId,
    );

    return {
      id: weight.photo.id,
      userId: weight.photo.userId,
      weightId: weight.photo.weightId,
      thumbnailUrl: signedUrls.thumbnailUrl,
      mediumUrl: signedUrls.mediumUrl,
      fullUrl: signedUrls.fullUrl,
      createdAt: weight.photo.createdAt,
      updatedAt: weight.photo.updatedAt,
    };
  }

  async remove(id: number, userId: number) {
    const weight = await this.findOneRaw(id, userId);

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
