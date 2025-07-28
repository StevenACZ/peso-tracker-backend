import {
  IsOptional,
  IsNumber,
  IsDateString,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWeightDto {
  @ApiPropertyOptional({
    example: 71.0,
    description: 'Nuevo peso registrado (kg)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999.99)
  @Transform(({ value }: { value: string }) => Math.round(parseFloat(value) * 100) / 100)
  weight?: number;

  @ApiPropertyOptional({
    example: '2026-02-01',
    description: 'Nueva fecha del registro de peso (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: 'Peso actualizado',
    description: 'Notas adicionales',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
