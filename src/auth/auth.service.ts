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
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
}
