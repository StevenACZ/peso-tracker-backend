import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'test2@example.com',
    description: 'Correo electrónico registrado',
  })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña del usuario',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  password: string;
}
