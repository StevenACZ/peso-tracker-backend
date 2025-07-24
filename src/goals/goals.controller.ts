import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() createGoalDto: CreateGoalDto) {
    // Convert and clean the DTO
    const processedDto = {
      ...createGoalDto,
      targetWeight: Number(createGoalDto.targetWeight),
      parentGoalId: createGoalDto.parentGoalId ? Number(createGoalDto.parentGoalId) : undefined,
      milestoneNumber: createGoalDto.milestoneNumber ? Number(createGoalDto.milestoneNumber) : undefined,
    };
    return this.goalsService.create(user.id, processedDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.goalsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.goalsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(id, user.id, updateGoalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.goalsService.remove(id, user.id);
  }
}