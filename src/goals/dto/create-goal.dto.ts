import {
  IsNumber,
  IsDateString,
  IsString,
  IsIn,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({
    example: 68.0,
    description: 'Peso objetivo para la meta (kg)',
  })
  @Expose()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(999.9)
  targetWeight: number;

  @ApiProperty({
    example: '2026-07-01',
    description: 'Fecha objetivo en formato YYYY-MM-DD',
  })
  @Expose()
  @IsDateString()
  targetDate: string;

  @ApiPropertyOptional({
    example: 'main',
    description: 'Tipo de meta: main o milestone',
  })
  @Expose()
  @IsOptional()
  @IsString()
  @IsIn(['main', 'milestone'])
  type?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la meta padre (solo para milestone)',
  })
  @Expose()
  @Type(() => Number)
  @IsOptional()
  parentGoalId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Número de hito (solo para milestone)',
  })
  @Expose()
  @Type(() => Number)
  @IsOptional()
  milestoneNumber?: number;
}
