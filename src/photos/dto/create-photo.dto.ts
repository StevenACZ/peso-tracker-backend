import { ApiProperty } from '@nestjs/swagger';

export class CreatePhotoDto {
  @ApiProperty({
    example: 1,
    description: 'ID del registro de peso asociado a la foto',
  })
  weightId: number;

  @ApiProperty({
    example: 'Foto de progreso',
    description: 'Notas o descripción de la foto',
    required: false,
  })
  notes?: string;
  // El campo de imagen se sube por form-data y no se documenta aquí
}
