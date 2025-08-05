import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadsPath: string;
  private readonly baseUrl: string;
  private readonly maxFileSize: number;

  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  constructor(
    private config: ConfigService,
  ) {
    this.uploadsPath =
      this.config.get<string>('storage.uploadsPath') || '/app/uploads';
    this.baseUrl =
      this.config.get<string>('storage.baseUrl') || 'http://localhost:3000';
    this.maxFileSize =
      this.config.get<number>('storage.maxFileSize') || 5242880; // 5MB

    // Ensure uploads directory exists
    void this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory() {
    try {
      await fs.access(this.uploadsPath);
    } catch {
      await fs.mkdir(this.uploadsPath, { recursive: true });
      this.logger.log(`Created uploads directory: ${this.uploadsPath}`);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    userId: number,
    weightId: number,
  ): Promise<{
    thumbnailUrl: string;
    mediumUrl: string;
    fullUrl: string;
  }> {
    // Validate file type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se aceptan: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Archivo muy grande. Tamaño máximo: ${Math.round(this.maxFileSize / 1024 / 1024)}MB`,
      );
    }

    const timestamp = Date.now();
    const fileExtension = this.getFileExtension(file.mimetype);
    const userDir = path.join(this.uploadsPath, userId.toString());
    const weightDir = path.join(userDir, weightId.toString());

    try {
      // Ensure user and weight directories exist
      await fs.mkdir(weightDir, { recursive: true });

      // Process images in different sizes
      const [thumbnailBuffer, mediumBuffer, fullBuffer] = await Promise.all([
        this.resizeImage(file.buffer, 150, 150),
        this.resizeImage(file.buffer, 400, 400),
        this.resizeImage(file.buffer, 800, 800),
      ]);

      // Save all sizes to filesystem
      const thumbnailPath = path.join(
        weightDir,
        `${timestamp}_thumbnail.${fileExtension}`,
      );
      const mediumPath = path.join(
        weightDir,
        `${timestamp}_medium.${fileExtension}`,
      );
      const fullPath = path.join(
        weightDir,
        `${timestamp}_full.${fileExtension}`,
      );

      await Promise.all([
        fs.writeFile(thumbnailPath, thumbnailBuffer),
        fs.writeFile(mediumPath, mediumBuffer),
        fs.writeFile(fullPath, fullBuffer),
      ]);

      // Generate public URLs
      const thumbnailUrl = `${this.baseUrl}/uploads/${userId}/${weightId}/${timestamp}_thumbnail.${fileExtension}`;
      const mediumUrl = `${this.baseUrl}/uploads/${userId}/${weightId}/${timestamp}_medium.${fileExtension}`;
      const fullUrl = `${this.baseUrl}/uploads/${userId}/${weightId}/${timestamp}_full.${fileExtension}`;

      return {
        thumbnailUrl,
        mediumUrl,
        fullUrl,
      };
    } catch (error) {
      this.logger.error(
        `Error uploading image for user ${userId}, weight ${weightId}:`,
        error,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Error al procesar la imagen. Verifique que el archivo sea una imagen válida.',
      );
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 3];
      const weightId = urlParts[urlParts.length - 2];

      const filePath = path.join(this.uploadsPath, userId, weightId, fileName);

      // Delete file from filesystem
      await fs.unlink(filePath);

      this.logger.log(`Deleted image: ${filePath}`);
    } catch (error) {
      this.logger.error('Error deleting image:', error);
      // Don't throw error for deletion failures to avoid blocking other operations
    }
  }

  async deleteAllImagesForWeight(
    userId: number,
    weightId: number,
  ): Promise<void> {
    try {
      const weightDir = path.join(
        this.uploadsPath,
        userId.toString(),
        weightId.toString(),
      );

      // Check if directory exists
      try {
        await fs.access(weightDir);
      } catch {
        // Directory doesn't exist, nothing to delete
        return;
      }

      // List all files in the directory
      const files = await fs.readdir(weightDir);

      // Delete all files
      await Promise.all(
        files.map((file) =>
          fs
            .unlink(path.join(weightDir, file))
            .catch((err) =>
              this.logger.error(`Error deleting file ${file}:`, err),
            ),
        ),
      );

      // Remove the empty directory
      await fs
        .rmdir(weightDir)
        .catch((err) =>
          this.logger.error(`Error removing directory ${weightDir}:`, err),
        );

      this.logger.log(
        `Deleted all images for weight ${weightId} of user ${userId}`,
      );
    } catch (error) {
      this.logger.error('Error deleting images for weight:', error);
    }
  }

  private async resizeImage(
    buffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  /**
   * Genera una URL segura firmada con JWT que expira
   * @param photoPath Path relativo de la imagen (ej: "uploads/1/1/imagen.jpg")
   * @param userId ID del usuario dueño de la imagen
   * @param expiresInSeconds Expiración en segundos (default: 1h para producción)
   */
  generateSecurePhotoUrl(
    photoPath: string,
    userId: number,
    expiresInSeconds: number = 3600,
  ): string {
    // Limpiar el path para asegurar formato correcto
    const cleanPath = photoPath.replace(/^https?:\/\/[^\/]+\//, '');
    
    const payload = {
      path: cleanPath,
      userId: userId,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };

    const secret = this.config.get<string>('jwt.secret');
    if (!secret) {
      throw new BadRequestException('JWT secret not configured');
    }
    const token = jwt.sign(payload, secret);
    return `${this.baseUrl}/photos/secure/${token}`;
  }

  getSignedUrlsForPhoto(
    photo: {
      thumbnailUrl: string;
      mediumUrl: string;
      fullUrl: string;
    },
    userId: number,
  ): {
    thumbnailUrl: string;
    mediumUrl: string;
    fullUrl: string;
  } {
    // Generar URLs temporales firmadas con JWT (1h para producción)
    return {
      thumbnailUrl: this.generateSecurePhotoUrl(photo.thumbnailUrl, userId),
      mediumUrl: this.generateSecurePhotoUrl(photo.mediumUrl, userId),
      fullUrl: this.generateSecurePhotoUrl(photo.fullUrl, userId),
    };
  }

  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    return extensions[mimeType] || 'jpg';
  }

  cleanupOrphanedFiles(): void {
    try {
      this.logger.log('Starting cleanup of orphaned files...');
      // Implementation for cleaning up orphaned files would go here
      // This is a placeholder for future enhancement
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}
