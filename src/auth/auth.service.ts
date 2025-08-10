import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(userId: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return user;
  }

  generateToken(payload: { userId: number }): string {
    return this.jwtService.sign(payload);
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('El email ya está registrado');
      }
      if (existingUser.username === username) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = this.generateToken({ userId: user.id });

      return {
        user,
        token,
      };
    } catch {
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generate token
    const token = this.generateToken({ userId: user.id });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async checkAvailability(checkDto: CheckAvailabilityDto) {
    const { username, email } = checkDto;
    
    if (!username && !email) {
      throw new BadRequestException('Debe proporcionar al menos username o email');
    }

    const conditions: Array<{ email?: string; username?: string }> = [];
    if (email) conditions.push({ email });
    if (username) conditions.push({ username });

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: conditions },
      select: { email: true, username: true },
    });

    const result = {
      email: {
        available: email ? !existingUser || existingUser.email !== email : undefined,
        checked: !!email,
      },
      username: {
        available: username ? !existingUser || existingUser.username !== username : undefined,
        checked: !!username,
      },
    };

    return result;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return {
        message: 'Si el email existe, recibirás un código de restablecimiento.',
      };
    }

    try {
      // Invalidate any existing reset codes for this user
      await this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      // Generate 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save reset code to database
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          code: resetCode,
          expiresAt,
        },
      });

      // Send reset email with code
      await this.emailService.sendPasswordResetCode(
        user.email,
        user.username,
        resetCode,
      );

      return {
        message: 'Si el email existe, recibirás un código de restablecimiento.',
      };
    } catch (error) {
      // Log the error but don't expose it to the user
      console.error('Error in forgotPassword:', error);
      return {
        message: 'Si el email existe, recibirás un código de restablecimiento.',
      };
    }
  }

  async verifyResetCode(verifyCodeDto: VerifyResetCodeDto) {
    const { email, code } = verifyCodeDto;
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Código inválido');
    }

    // Find valid reset code
    const resetTokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gte: new Date() },
        attempts: { lt: 3 }, // Max 3 attempts
      },
    });

    if (!resetTokenRecord) {
      // Increment attempts for existing codes
      await this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          code,
          used: false,
          expiresAt: { gte: new Date() },
        },
        data: {
          attempts: { increment: 1 },
        },
      });

      throw new BadRequestException('Código inválido o expirado');
    }

    // Generate JWT token valid for 5 minutes for password reset
    const resetToken = this.jwtService.sign(
      { 
        userId: user.id, 
        purpose: 'password-reset',
        codeId: resetTokenRecord.id 
      },
      { expiresIn: '5m' }
    );
    
    return {
      valid: true,
      resetToken, // JWT token to use in reset-password endpoint
    };
  }


  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token);
      
      // Validate token purpose and structure
      if (payload.purpose !== 'password-reset' || !payload.userId || !payload.codeId) {
        throw new BadRequestException('Token de restablecimiento inválido');
      }

      // Verify the original code is still valid and unused
      const resetTokenRecord = await this.prisma.passwordResetToken.findFirst({
        where: {
          id: payload.codeId,
          userId: payload.userId,
          used: false,
          expiresAt: { gte: new Date() },
        },
      });

      if (!resetTokenRecord) {
        throw new BadRequestException('Token de restablecimiento inválido o expirado');
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and mark code as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: payload.userId },
          data: { password: hashedPassword },
        }),
        this.prisma.passwordResetToken.update({
          where: { id: resetTokenRecord.id },
          data: { used: true },
        }),
      ]);

      return {
        message: 'Contraseña restablecida exitosamente.',
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token de restablecimiento inválido o expirado');
      }
      throw new BadRequestException('Error al restablecer la contraseña');
    }
  }

  async verifyResetToken(code: string) {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      select: { id: true },
    });

    return {
      valid: !!resetToken,
    };
  }
}
