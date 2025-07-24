import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWeightDto {
  @ApiProperty({ example: 72.5, description: 'Peso registrado (kg)' })
  @IsNumber({ maxDecimalPlaces: 1 })
  @IsNotEmpty()
  @Min(1)
  @Max(999.9)
  @Type(() => Number)
  weight: number;

  @ApiProperty({
    example: '2026-01-25',
    description: 'Fecha del registro de peso (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    example: 'Peso de prueba',
    description: 'Notas adicionales',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
