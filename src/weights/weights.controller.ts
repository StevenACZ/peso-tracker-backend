import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WeightsService } from './weights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWeightDto } from './dto/create-weight.dto';
import { UpdateWeightDto } from './dto/update-weight.dto';
import { GetChartDataQueryDto } from './dto/get-chart-data-query.dto';
import { GetPaginatedQueryDto } from './dto/get-paginated-query.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Weights')
@ApiBearerAuth()
@Controller('weights')
@UseGuards(JwtAuthGuard)
export class WeightsController {
  constructor(private readonly weightsService: WeightsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({
    summary: 'Crear un nuevo registro de peso con foto opcional',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del peso y foto opcional',
    schema: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
          example: 72.5,
          description: 'Peso registrado (kg)',
        },
        date: {
          type: 'string',
          format: 'date',
          example: '2026-01-25',
          description: 'Fecha del registro de peso (YYYY-MM-DD)',
        },
        notes: {
          type: 'string',
          example: 'Peso de prueba',
          description: 'Notas adicionales',
        },
        photoNotes: {
          type: 'string',
          example: 'Foto de progreso',
          description: 'Notas de la foto',
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de foto (opcional)',
        },
      },
      required: ['weight', 'date'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'El registro de peso ha sido creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  create(
    @CurrentUser() user: { id: number },
    @Body() createWeightDto: CreateWeightDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.weightsService.create(user.id, createWeightDto, file);
  }

  @Get('chart-data')
  @ApiOperation({
    summary: 'Obtener datos de peso para gráficos con paginación temporal',
    description: 'Retorna datos de peso por períodos que contienen registros (todos, mes, trimestre, semestre, año) con navegación entre períodos.',
  })
  @ApiQuery({
    name: 'timeRange',
    description: 'Tipo de período a mostrar',
    enum: ['all', '1month', '3months', '6months', '1year'],
    required: false,
  })
  @ApiQuery({
    name: 'page',
    description: 'Página del período (0 = más reciente, 1 = anterior, etc.)',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Datos de peso para gráficos con metadata de navegación.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              weight: { type: 'number', example: 72.5 },
              date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            currentPeriod: { type: 'string', example: 'Enero 2024' },
            hasNext: { type: 'boolean', example: true },
            hasPrevious: { type: 'boolean', example: false },
            totalPeriods: { type: 'number', example: 12 },
            currentPage: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  getChartData(
    @CurrentUser() user: { id: number },
    @Query() query: GetChartDataQueryDto,
  ) {
    return this.weightsService.getChartData(user.id, query.timeRange, query.page);
  }

  @Get('progress')
  @ApiOperation({ 
    summary: 'Obtener progreso de peso con fotos',
    description: 'Retorna todos los registros de peso que tienen fotos asociadas, ordenados cronológicamente desde el más antiguo al más reciente para visualizar el progreso visual.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de peso con fotos para visualizar progreso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          weight: { type: 'number', example: 72.5 },
          date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
          notes: { type: 'string', example: 'Peso después del ejercicio' },
          photo: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              userId: { type: 'number', example: 123 },
              weightId: { type: 'number', example: 1 },
              notes: { type: 'string', example: 'Foto de progreso' },
              thumbnailUrl: { type: 'string', example: 'https://example.com/thumb.jpg' },
              mediumUrl: { type: 'string', example: 'https://example.com/medium.jpg' },
              fullUrl: { type: 'string', example: 'https://example.com/full.jpg' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  getWeightProgress(@CurrentUser() user: { id: number }) {
    return this.weightsService.getWeightProgress(user.id);
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Obtener registros de peso paginados para tabla' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de registros de peso.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              weight: { type: 'number', example: 72.5 },
              date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
              notes: { type: 'string', example: 'Peso después del ejercicio' },
              hasPhoto: { type: 'boolean', example: true },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 5 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  getPaginatedData(
    @CurrentUser() user: { id: number },
    @Query() query: GetPaginatedQueryDto,
  ) {
    return this.weightsService.getPaginatedData(
      user.id,
      query.page,
      query.limit,
    );
  }


  @Get(':id')
  @ApiOperation({ summary: 'Obtener un registro de peso por ID' })
  @ApiResponse({
    status: 200,
    description: 'El registro de peso.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro de peso no encontrado.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.weightsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Actualizar un registro de peso con foto opcional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del peso y foto opcional para actualizar',
    schema: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
          example: 71.0,
          description: 'Nuevo peso registrado (kg)',
        },
        date: {
          type: 'string',
          format: 'date',
          example: '2026-02-01',
          description: 'Nueva fecha del registro de peso (YYYY-MM-DD)',
        },
        notes: {
          type: 'string',
          example: 'Peso actualizado',
          description: 'Notas adicionales',
        },
        photoNotes: {
          type: 'string',
          example: 'Foto actualizada',
          description: 'Notas de la foto',
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de foto (opcional, reemplaza la existente)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'El registro de peso ha sido actualizado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro de peso no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() updateWeightDto: UpdateWeightDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.weightsService.update(id, user.id, updateWeightDto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un registro de peso' })
  @ApiResponse({
    status: 200,
    description: 'El registro de peso ha sido eliminado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro de peso no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.weightsService.remove(id, user.id);
  }
}
