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

  @Get('supabase')
  @ApiOperation({ summary: 'Comprobar el estado de Supabase' })
  @ApiResponse({
    status: 200,
    description: 'El estado de Supabase.',
  })
  async checkSupabase() {
    return this.healthService.checkSupabase();
  }
}
