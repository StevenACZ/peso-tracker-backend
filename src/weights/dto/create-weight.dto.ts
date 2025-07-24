import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWeightDto {
  @IsNumber({ maxDecimalPlaces: 1 })
  @IsNotEmpty()
  @Min(1)
  @Max(999.9)
  @Type(() => Number)
  weight: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}