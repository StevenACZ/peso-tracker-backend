import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Comprobar el estado general de la aplicación' })
  @ApiResponse({
    status: 200,
    description: 'El estado de la aplicación.',
  })
  async check() {
    return this.healthService.check();
  }

  @Get('database')
  @ApiOperation({ summary: 'Comprobar el estado de la base de datos' })
  @ApiResponse({
    status: 200,
    description: 'El estado de la base de datos.',
  })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('storage')
  @ApiOperation({
    summary: 'Comprobar el estado del almacenamiento de archivos',
  })
  @ApiResponse({
    status: 200,
    description: 'El estado del sistema de archivos para uploads.',
  })
  async checkStorage() {
    return this.healthService.checkStorage();
  }
}
