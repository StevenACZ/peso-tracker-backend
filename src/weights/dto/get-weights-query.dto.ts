import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetWeightsQueryDto {
  @ApiProperty({
    description: 'Número de página',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Número de registros por página',
    required: false,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Fecha de inicio para filtrar (formato ISO 8601)',
    required: false,
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value && typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Formato de fecha inválido para startDate');
      }
    }
    return value;
  })
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar (formato ISO 8601)',
    required: false,
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value && typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Formato de fecha inválido para endDate');
      }
    }
    return value;
  })
  endDate?: string;
}
