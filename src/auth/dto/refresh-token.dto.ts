import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token para generar un nuevo access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  @IsString({ message: 'El refresh token debe ser una cadena' })
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  refreshToken: string;
}
