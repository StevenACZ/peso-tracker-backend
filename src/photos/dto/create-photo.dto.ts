import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePhotoDto {
  @ApiProperty({
    example: 1,
    description: 'ID del registro de peso asociado a la foto',
  })
  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: 'weightId debe ser un número válido' })
  weightId: number;

  @ApiProperty({
    example: 'Foto de progreso',
    description: 'Notas o descripción de la foto',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'notes debe ser una cadena de texto' })
  notes?: string;
}
