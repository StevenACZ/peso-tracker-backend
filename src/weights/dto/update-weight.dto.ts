import { IsOptional, IsNumber, IsDateString, IsString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateWeightDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(999.9)
  @Transform(({ value }) => parseFloat(value))
  weight?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}