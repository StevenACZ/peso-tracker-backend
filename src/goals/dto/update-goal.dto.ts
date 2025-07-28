import { IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGoalDto {
  @ApiPropertyOptional({
    example: 67.5,
    description: 'Nuevo peso objetivo (kg)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999.99)
  @Type(() => Number)
  @Transform(({ value }) => Math.round(value * 100) / 100)
  targetWeight?: number;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Nueva fecha objetivo (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}
