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
} from '@nestjs/common';
import { WeightsService } from './weights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWeightDto } from './dto/create-weight.dto';
import { UpdateWeightDto } from './dto/update-weight.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Weights')
@ApiBearerAuth()
@Controller('weights')
@UseGuards(JwtAuthGuard)
export class WeightsController {
  constructor(private readonly weightsService: WeightsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo registro de peso' })
  @ApiResponse({
    status: 201,
    description: 'El registro de peso ha sido creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  create(@CurrentUser() user: { id: number }, @Body() createWeightDto: CreateWeightDto) {
    return this.weightsService.create(user.id, createWeightDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los registros de peso del usuario' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de registros por página',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio para filtrar (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin para filtrar (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de peso.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  findAll(
    @CurrentUser() user: { id: number },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.weightsService.findAll(
      user.id,
      page,
      limit,
      startDate,
      endDate,
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
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.weightsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un registro de peso' })
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
  ) {
    return this.weightsService.update(id, user.id, updateWeightDto);
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
