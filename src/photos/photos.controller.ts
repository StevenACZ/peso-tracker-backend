import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { PhotoRateLimitGuard } from '../security/rate-limiting.guard';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SecurePhotoPayload {
  path: string;
  userId: number;
  exp: number;
  ctx?: string; // mobile context
  cf?: boolean; // cloudflare detected
}

@ApiTags('Photos')
@Controller('photos')
export class PhotosController {
  private readonly uploadsPath: string;
  private readonly logger = new Logger(PhotosController.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly rateLimitGuard: PhotoRateLimitGuard,
  ) {
    this.uploadsPath =
      this.configService.get<string>('storage.uploadsPath') || '/app/uploads';
  }

  @Get('secure/:token')
  @UseGuards(PhotoRateLimitGuard)
  @ApiOperation({
    summary: 'Obtener imagen con URL firmada y temporal',
    description:
      'Sirve imágenes usando tokens JWT que expiran (15min para producción) con validación de ownership y rate limiting',
  })
  @ApiParam({
    name: 'token',
    description: 'Token JWT firmado que contiene path de imagen y userId',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiResponse({
    status: 200,
    description: 'Imagen servida exitosamente',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 400, description: 'Token inválido o malformado' })
  @ApiResponse({ status: 401, description: 'Token expirado' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async getSecurePhoto(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // 1. Detect Cloudflare and Apple client
      const cloudflareHeaders = req.headers as Record<string, string>;
      const isCloudflare = !!(
        cloudflareHeaders['cf-ray'] || cloudflareHeaders['cf-connecting-ip']
      );
      const isAppleClient = this.detectAppleClient(
        req.headers['user-agent'] as string,
      );
      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';

      // 2. Verificar y decodificar el token JWT
      const payload = this.jwtService.verify<SecurePhotoPayload>(token);

      // 3. Enhanced token validation for Apple apps
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && now > payload.exp) {
        throw new UnauthorizedException('Token expirado');
      }

      // 4. Validate mobile context for security
      if (isAppleClient && payload.ctx !== 'mobile') {
        throw new BadRequestException('Token no válido para este cliente');
      }

      // 5. Extraer información del payload
      const { path: photoPath, userId } = payload;

      if (!photoPath || !userId) {
        throw new BadRequestException(
          'Token inválido: faltan datos requeridos',
        );
      }

      // 5.1. CRITICAL SECURITY: Cross-validate photo ownership
      await this.validatePhotoOwnership(photoPath, userId, req);

      // 6. Construir path completo del archivo con validación de seguridad
      // Clean path from nginx prefixes and normalize
      let cleanPath = photoPath;
      // Remove nginx route prefix if present (for backward compatibility)
      cleanPath = cleanPath.replace(/^peso-tracker\/v1\//, '');
      // Ensure path starts with uploads/
      if (!cleanPath.startsWith('uploads/')) {
        cleanPath = `uploads/${cleanPath}`;
      }
      // Extract relative path (everything after uploads/)
      const relativePath = cleanPath.replace(/^uploads\//, '');

      // Security: prevent path traversal
      if (relativePath.includes('..') || relativePath.includes('/./')) {
        throw new BadRequestException('Path inválido');
      }

      const fullPath = path.join(this.uploadsPath, relativePath);
      
      this.logger.log(`Photo access attempt: original=${photoPath}, clean=${cleanPath}, relative=${relativePath}, full=${fullPath}`);

      // 7. Verificar que el archivo existe y permisos
      try {
        await fs.access(fullPath);
        const stats = await fs.stat(fullPath);
        if (!stats.isFile()) {
          throw new NotFoundException('Recurso no encontrado');
        }
      } catch {
        throw new NotFoundException('Imagen no encontrada');
      }

      // 8. Leer el archivo
      const imageBuffer = await fs.readFile(fullPath);

      // 9. Determinar formato y tipo de contenido optimizado
      const ext = path.extname(fullPath).toLowerCase();
      const format = this.getFormatFromExtension(ext);
      const contentType = this.getContentType(ext);

      // 10. Generate Apple-optimized headers
      const appleHeaders = this.storageService.getAppleOptimizedHeaders(
        format,
        isCloudflare,
      );

      // 11. Configurar headers de respuesta optimizados y seguros
      const headers: Record<string, string> = {
        ...appleHeaders,
        'Content-Length': imageBuffer.length.toString(),
        // Override cache for secure URLs (shorter for security)
        'Cache-Control': isCloudflare
          ? 'private, max-age=900, s-maxage=3600' // 15min browser, 1h edge (more secure)
          : isProduction
            ? 'private, max-age=300'
            : 'private, max-age=60', // 5min prod, 1min dev
        // Enhanced security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy':
          "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
        'Strict-Transport-Security': isProduction
          ? 'max-age=31536000; includeSubDomains; preload'
          : 'max-age=86400',
        'Permissions-Policy':
          'camera=(), microphone=(), geolocation=(), payment=()',
        // Apple-specific performance headers
        'Accept-Ranges': 'bytes',
        'X-Optimized-For': isAppleClient ? 'apple-mobile' : 'web',
        // Security audit headers
        'X-Photo-Validated': 'true',
        'X-Rate-Limited': 'protected',
      };

      // Add CORS headers if needed
      const corsOrigin = this.configService.get('cors.origin');
      if (corsOrigin) {
        headers['Access-Control-Allow-Origin'] = corsOrigin;
        headers['Access-Control-Allow-Credentials'] = 'true';
      }

      // Set headers
      res.set(headers);

      // 12. Enviar imagen optimizada
      res.send(imageBuffer);
    } catch (error) {
      // Record failed attempt for rate limiting
      this.rateLimitGuard.recordFailedAttempt(req);

      // Si es un error de JWT (token inválido, expirado, etc.)
      if (error.name === 'JsonWebTokenError') {
        this.logger.warn(`Invalid JWT token attempt`, {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          error: error.message,
        });
        throw new BadRequestException('Token JWT inválido');
      }
      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`Expired JWT token attempt`, {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          error: error.message,
        });
        throw new UnauthorizedException('Token expirado');
      }

      // Re-lanzar otros errores conocidos
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        // Log security-related errors for audit
        if (error instanceof ForbiddenException) {
          this.logger.error(`Security violation detected`, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            error: error.message,
          });
        }
        throw error;
      }

      // Error inesperado
      this.logger.error(`Unexpected error in photo access`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        error: error.message,
        stack: error.stack,
      });
      throw new BadRequestException('Error al procesar la imagen');
    }
  }

  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }

  private getFormatFromExtension(extension: string): string {
    const formatMap: Record<string, string> = {
      '.jpg': 'webp',
      '.jpeg': 'webp',
      '.png': 'webp',
      '.webp': 'webp',
    };

    return formatMap[extension] || 'webp';
  }

  private detectAppleClient(userAgent: string = ''): boolean {
    // Detect iOS, macOS, iPad clients
    const applePatterns = [
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /Macintosh/i,
      /Mac OS X/i,
      /Darwin/i,
      /CFNetwork/i, // Apple networking framework
      /Foundation/i, // Apple Foundation framework
    ];

    return applePatterns.some((pattern) => pattern.test(userAgent));
  }

  private async validatePhotoOwnership(
    photoPath: string,
    userId: number,
    req: Request,
  ): Promise<void> {
    try {
      // Extract weight ID from photo path: uploads/{userId}/{weightId}/{timestamp}_{size}.{ext}
      const pathParts = photoPath.split('/');
      if (pathParts.length < 3) {
        this.logger.warn(`Invalid photo path structure: ${photoPath}`, {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          tokenUserId: userId,
        });
        throw new ForbiddenException('Acceso denegado');
      }

      const pathUserId = parseInt(pathParts[1], 10);
      const weightId = parseInt(pathParts[2], 10);

      // SECURITY CHECK 1: Path userId must match token userId
      if (pathUserId !== userId) {
        this.logger.error(
          `Photo ownership mismatch: path userId ${pathUserId} != token userId ${userId}`,
          {
            photoPath,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            tokenUserId: userId,
            pathUserId,
          },
        );
        throw new ForbiddenException('Acceso denegado');
      }

      // SECURITY CHECK 2: Verify weight belongs to user in database
      const weight = await this.prisma.weight.findUnique({
        where: { id: weightId },
        select: { userId: true, id: true },
      });

      if (!weight) {
        this.logger.warn(`Weight not found for ID ${weightId}`, {
          weightId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          tokenUserId: userId,
        });
        throw new NotFoundException('Recurso no encontrado');
      }

      if (weight.userId !== userId) {
        this.logger.error(
          `Database ownership mismatch: weight userId ${weight.userId} != token userId ${userId}`,
          {
            photoPath,
            weightId,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            tokenUserId: userId,
            dbUserId: weight.userId,
          },
        );
        throw new ForbiddenException('Acceso denegado');
      }

      // Log successful access for audit trail
      this.logger.log(
        `Photo access granted: userId=${userId}, weightId=${weightId}`,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          photoPath,
        },
      );
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(`Photo ownership validation failed: ${error.message}`, {
        photoPath,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        tokenUserId: userId,
        error: error.stack,
      });
      throw new ForbiddenException('Acceso denegado');
    }
  }
}
