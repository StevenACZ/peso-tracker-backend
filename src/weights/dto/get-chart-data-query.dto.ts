import { IsOptional, IsString, IsIn, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetChartDataQueryDto {
  @ApiProperty({
    description: 'Tipo de período para los datos del gráfico',
    required: false,
    default: '1month',
    enum: ['all', '1month', '3months', '6months', '1year'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', '1month', '3months', '6months', '1year'])
  timeRange?: string = '1month';

  @ApiProperty({
    description:
      'Número de página del período (0 = más reciente, 1 = anterior, etc.)',
    required: false,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number = 0;
}
