import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type, Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWeightDto {
  @ApiProperty({ example: 72.5, description: 'Peso registrado (kg)' })
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(1)
  @Max(999.99)
  @Type(() => Number)
  @Transform(({ value }) => Math.round(value * 100) / 100)
  weight: number;

  @ApiProperty({
    example: '2026-01-25',
    description: 'Fecha del registro de peso (YYYY-MM-DD)',
  })
  @Expose()
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    example: 'Peso de prueba',
    description: 'Notas adicionales',
  })
  @Expose()
  @IsOptional()
  @IsString()
  notes?: string;
}
