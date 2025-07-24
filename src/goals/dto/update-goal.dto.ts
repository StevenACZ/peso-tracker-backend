import {
  IsOptional,
  IsNumber,
  IsDateString,
  IsString,
  IsIn,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGoalDto {
  @ApiPropertyOptional({
    example: 67.5,
    description: 'Nuevo peso objetivo (kg)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(999.9)
  @Type(() => Number)
  targetWeight?: number;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Nueva fecha objetivo (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({
    example: 'milestone',
    description: 'Tipo de meta: main o milestone',
  })
  @IsOptional()
  @IsString()
  @IsIn(['main', 'milestone'])
  type?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Nuevo ID de meta padre (solo para milestone)',
  })
  @IsOptional()
  @ValidateIf(
    (o: UpdateGoalDto) =>
      o.parentGoalId !== undefined &&
      o.parentGoalId !== null
  )
  @IsNumber()
  @Type(() => Number)
  parentGoalId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Nuevo número de hito (solo para milestone)',
  })
  @IsOptional()
  @ValidateIf(
    (o: UpdateGoalDto) =>
      o.milestoneNumber !== undefined &&
      o.milestoneNumber !== null
  )
  @IsNumber()
  @Type(() => Number)
  milestoneNumber?: number;
}
