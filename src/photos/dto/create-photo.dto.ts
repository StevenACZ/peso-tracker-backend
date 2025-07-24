import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePhotoDto {
  @ApiProperty({
    example: 1,
    description: 'ID del registro de peso asociado a la foto',
  })
  @Type(() => Number)
  weightId: number;

  @ApiProperty({
    example: 'Foto de progreso',
    description: 'Notas o descripción de la foto',
    required: false,
  })
  notes?: string;
  // El campo de imagen se sube por form-data y no se documenta aquí
}
