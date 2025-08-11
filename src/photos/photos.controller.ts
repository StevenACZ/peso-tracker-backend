import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
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

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    this.uploadsPath =
      this.configService.get<string>('storage.uploadsPath') || '/app/uploads';
  }

  @Get('secure/:token')
  @ApiOperation({
    summary: 'Obtener imagen con URL firmada y temporal',
    description: 'Sirve imágenes usando tokens JWT que expiran (1 hora para producción)',
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
      const isCloudflare = !!(cloudflareHeaders['cf-ray'] || cloudflareHeaders['cf-connecting-ip']);
      const isAppleClient = this.detectAppleClient(req.headers['user-agent'] as string);
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

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
        throw new BadRequestException('Token inválido: faltan datos requeridos');
      }

      // 6. Construir path completo del archivo con validación de seguridad
      const relativePath = photoPath.replace(/^uploads\//, '');
      
      // Security: prevent path traversal
      if (relativePath.includes('..') || relativePath.includes('/./')) {
        throw new BadRequestException('Path inválido');
      }
      
      const fullPath = path.join(this.uploadsPath, relativePath);

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
      const appleHeaders = this.storageService.getAppleOptimizedHeaders(format, isCloudflare);
      
      // 11. Configurar headers de respuesta optimizados
      const headers: Record<string, string> = {
        ...appleHeaders,
        'Content-Length': imageBuffer.length.toString(),
        // Override cache for secure URLs (shorter for security)
        'Cache-Control': isCloudflare 
          ? 'public, max-age=3600, s-maxage=86400' // 1h browser, 1d edge
          : (isProduction ? 'private, max-age=300' : 'private, max-age=60'), // 5min prod, 1min dev
        // Apple-specific performance headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // Mobile performance hints
        'Accept-Ranges': 'bytes',
        'X-Optimized-For': isAppleClient ? 'apple-mobile' : 'web',
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
      // Si es un error de JWT (token inválido, expirado, etc.)
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token JWT inválido');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      }

      // Re-lanzar otros errores conocidos
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Error inesperado
      throw new BadRequestException('Error al procesar la imagen');
    }
  }

  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
      '.gif': 'image/gif',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }

  private getFormatFromExtension(extension: string): string {
    const formatMap: Record<string, string> = {
      '.jpg': 'jpeg',
      '.jpeg': 'jpeg', 
      '.png': 'jpeg', // Convert PNG to JPEG for consistency
      '.webp': 'webp',
      '.heic': 'heic',
      '.heif': 'heic',
    };

    return formatMap[extension] || 'jpeg';
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

    return applePatterns.some(pattern => pattern.test(userAgent));
  }
}