import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener dashboard del usuario con estadísticas' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard del usuario con estadísticas de peso y meta activa.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  getDashboard(@CurrentUser() user: { id: number }) {
    return this.dashboardService.getDashboard(user.id);
  }
}