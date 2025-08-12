import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario que desea restablecer su contraseña',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
