import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SecurePhotoPayload {
  path: string;
  userId: number;
  exp: number;
}

@ApiTags('Photos')
@Controller('photos')
export class PhotosController {
  private readonly uploadsPath: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    @Res() res: Response,
  ): Promise<void> {
    try {
      // 1. Verificar y decodificar el token JWT
      const payload = this.jwtService.verify<SecurePhotoPayload>(token);

      // 2. Verificar que el token no haya expirado (verificación adicional)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && now > payload.exp) {
        throw new UnauthorizedException('Token expirado');
      }

      // 3. Extraer información del payload
      const { path: photoPath, userId } = payload;

      if (!photoPath || !userId) {
        throw new BadRequestException('Token inválido: faltan datos requeridos');
      }

      // 4. Construir path completo del archivo
      // photoPath viene como "uploads/1/1/imagen.jpg" desde la DB
      // Necesitamos usar uploadsPath como base
      const relativePath = photoPath.replace(/^uploads\//, '');
      const fullPath = path.join(this.uploadsPath, relativePath);

      // 5. Verificar que el archivo existe
      try {
        await fs.access(fullPath);
      } catch {
        throw new NotFoundException('Imagen no encontrada');
      }

      // 6. Leer el archivo
      const imageBuffer = await fs.readFile(fullPath);

      // 7. Determinar tipo de contenido basado en extensión
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = this.getContentType(ext);

      // 8. Configurar headers de respuesta
      res.set({
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'private, max-age=10', // Cache corto para URLs temporales
        'Access-Control-Allow-Origin': this.configService.get('cors.origin'),
        'Access-Control-Allow-Credentials': 'true',
      });

      // 9. Enviar imagen
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
      '.gif': 'image/gif',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }
}