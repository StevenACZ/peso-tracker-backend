import { IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Expose, Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({
    example: 68.0,
    description: 'Peso objetivo para la meta (kg)',
  })
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => Math.round(value * 100) / 100)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999.99)
  targetWeight: number;

  @ApiProperty({
    example: '2026-07-01',
    description: 'Fecha objetivo en formato YYYY-MM-DD',
  })
  @Expose()
  @IsDateString()
  targetDate: string;
}
