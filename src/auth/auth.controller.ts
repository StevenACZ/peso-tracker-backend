import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordWithCodeDto } from './dto/reset-password-with-code.dto';
import { ApiBody, ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description:
      'Crea una nueva cuenta de usuario y devuelve los datos del usuario y un token de acceso.',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      'Usuario de prueba': {
        summary: 'Un ejemplo de un usuario de prueba',
        value: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente.',
    schema: {
      example: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2025-07-24T12:00:00.000Z',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({
    status: 409,
    description: 'El correo electrónico o nombre de usuario ya existen.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica a un usuario y devuelve los datos del usuario y un token de acceso.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      'Credenciales de prueba': {
        summary: 'Un ejemplo de credenciales de inicio de sesión',
        value: {
          email: 'test@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso.',
    schema: {
      example: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2025-07-24T12:00:00.000Z',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('check-availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar disponibilidad de username y email',
    description: 'Verifica si un username y/o email están disponibles para registro.',
  })
  @ApiBody({
    type: CheckAvailabilityDto,
    examples: {
      'Verificar ambos': {
        summary: 'Verificar username y email',
        value: {
          username: 'newuser',
          email: 'new@example.com',
        },
      },
      'Solo username': {
        summary: 'Verificar solo username',
        value: {
          username: 'newuser',
        },
      },
      'Solo email': {
        summary: 'Verificar solo email',
        value: {
          email: 'new@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad verificada exitosamente.',
    schema: {
      example: {
        email: {
          available: true,
          checked: true,
        },
        username: {
          available: false,
          checked: true,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Debe proporcionar al menos username o email.' })
  async checkAvailability(@Body() checkDto: CheckAvailabilityDto) {
    return this.authService.checkAvailability(checkDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar restablecimiento de contraseña',
    description: 'Envía un email con un enlace para restablecer la contraseña.',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      'Email de usuario': {
        summary: 'Solicitar reset para un email',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email de restablecimiento enviado (si el email existe).',
    schema: {
      example: {
        message: 'Si el email existe, recibirás un enlace de restablecimiento.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email inválido.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description: 'Cambia la contraseña usando un token válido de restablecimiento.',
  })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      'Reset con token': {
        summary: 'Restablecer contraseña con token',
        value: {
          token: 'abc123def456',
          newPassword: 'newSecurePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente.',
    schema: {
      example: {
        message: 'Contraseña restablecida exitosamente.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Token inválido, expirado o datos incorrectos.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código de restablecimiento',
    description: 'Verifica si un código de 6 dígitos es válido para restablecer contraseña.',
  })
  @ApiBody({
    type: VerifyResetCodeDto,
    examples: {
      'Verificar código': {
        summary: 'Verificar código recibido por email',
        value: {
          email: 'user@example.com',
          code: '892934',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código verificado exitosamente.',
    schema: {
      example: {
        valid: true,
        tempToken: 'abc123def456...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Código inválido o expirado.' })
  async verifyResetCode(@Body() verifyCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(verifyCodeDto);
  }

  @Post('reset-password-with-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña con código',
    description: 'Cambia la contraseña usando un código de 6 dígitos válido.',
  })
  @ApiBody({
    type: ResetPasswordWithCodeDto,
    examples: {
      'Reset con código': {
        summary: 'Restablecer contraseña con código de 6 dígitos',
        value: {
          email: 'user@example.com',
          code: '892934',
          newPassword: 'newSecurePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente.',
    schema: {
      example: {
        message: 'Contraseña restablecida exitosamente.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Código inválido, expirado o datos incorrectos.' })
  async resetPasswordWithCode(@Body() resetWithCodeDto: ResetPasswordWithCodeDto) {
    return this.authService.resetPasswordWithCode(resetWithCodeDto);
  }
}
