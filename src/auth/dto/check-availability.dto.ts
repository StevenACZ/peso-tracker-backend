import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    example: 'testuser',
    description: 'Nombre de usuario a verificar',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiProperty({
    example: 'test@example.com',
    description: 'Correo electrónico a verificar',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
