import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImageProcessingService } from '../image/image-processing.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadsPath: string;
  private readonly baseUrl: string;
  private readonly maxFileSize: number;

  private readonly isProduction: boolean;
  private readonly isCloudflare: boolean;

  constructor(
    private config: ConfigService,
    private imageProcessing: ImageProcessingService,
  ) {
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';
    this.isCloudflare = false; // Will be detected per request
    this.uploadsPath =
      this.config.get<string>('storage.uploadsPath') || '/app/uploads';
    this.baseUrl =
      this.config.get<string>('storage.baseUrl') || 'http://localhost:3000';
    this.maxFileSize =
      this.config.get<number>('storage.maxFileSize') || 10485760; // 10MB for HEIF

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
    cloudflareDetected: boolean = false,
  ): Promise<{
    thumbnailUrl: string;
    mediumUrl: string;
    fullUrl: string;
    format: string;
    metadata: {
      originalSize: number;
      processedSizes: { thumbnail: number; medium: number; full: number };
      format: string;
    };
  }> {
    const timestamp = Date.now();
    const userDir = path.join(this.uploadsPath, userId.toString());
    const weightDir = path.join(userDir, weightId.toString());

    try {
      // Ensure directories exist with proper permissions
      await fs.mkdir(weightDir, { recursive: true, mode: 0o700 });

      // Process image using the new ImageProcessingService
      const processedResult = await this.imageProcessing.processImage(file, this.maxFileSize);
      const fileExtension = this.imageProcessing.getFileExtension(processedResult.format);

      // Generate file paths
      const thumbnailPath = path.join(weightDir, `${timestamp}_thumbnail.${fileExtension}`);
      const mediumPath = path.join(weightDir, `${timestamp}_medium.${fileExtension}`);
      const fullPath = path.join(weightDir, `${timestamp}_full.${fileExtension}`);

      // Save all processed sizes to filesystem
      await Promise.all([
        fs.writeFile(thumbnailPath, processedResult.thumbnailBuffer, { mode: 0o600 }),
        fs.writeFile(mediumPath, processedResult.mediumBuffer, { mode: 0o600 }),
        fs.writeFile(fullPath, processedResult.fullBuffer, { mode: 0o600 }),
      ]);

      // Generate public URLs (will be converted to signed URLs later)
      const thumbnailUrl = `${this.baseUrl}/uploads/${userId}/${weightId}/${timestamp}_thumbnail.${fileExtension}`;
      const mediumUrl = `${this.baseUrl}/uploads/${userId}/${weightId}/${timestamp}_medium.${fileExtension}`;
      const fullUrl = `${this.baseUrl}/uploads/${userId}/${weightId}/${timestamp}_full.${fileExtension}`;

      // Prepare metadata for iOS/macOS apps
      const metadata = {
        originalSize: file.size,
        processedSizes: {
          thumbnail: processedResult.thumbnailBuffer.length,
          medium: processedResult.mediumBuffer.length,
          full: processedResult.fullBuffer.length,
        },
        format: processedResult.format,
      };

      this.logger.log(
        `Image uploaded successfully for user ${userId}, weight ${weightId}. Format: ${processedResult.format}, Savings: ${Math.round((1 - (metadata.processedSizes.full / metadata.originalSize)) * 100)}%`,
      );

      return {
        thumbnailUrl,
        mediumUrl,
        fullUrl,
        format: processedResult.format,
        metadata,
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


  /**
   * Genera una URL segura firmada con JWT optimizada para apps móviles
   * @param photoPath Path relativo de la imagen
   * @param userId ID del usuario dueño de la imagen
   * @param cloudflareHeaders Headers para detectar Cloudflare
   * @param expiresInSeconds Expiración personalizada (opcional)
   */
  generateSecurePhotoUrl(
    photoPath: string,
    userId: number,
    cloudflareHeaders?: Record<string, string>,
    expiresInSeconds?: number,
  ): string {
    // Auto-detect Cloudflare and adjust expiry for Apple apps
    const isCloudflare = !!(cloudflareHeaders?.['cf-ray'] || cloudflareHeaders?.['cf-connecting-ip']);
    const defaultExpiry = this.isProduction && !isCloudflare ? 900 : 1800; // 15min prod, 30min dev/cloudflare
    const expiry = expiresInSeconds || defaultExpiry;

    const cleanPath = photoPath.replace(/^https?:\/\/[^\/]+\//, '');
    
    const payload = {
      path: cleanPath,
      userId: userId,
      exp: Math.floor(Date.now() / 1000) + expiry,
      // Add device context for Apple apps
      ctx: 'mobile',
      cf: isCloudflare,
    };

    const secret = this.config.get<string>('jwt.secret');
    if (!secret) {
      throw new BadRequestException('JWT secret not configured');
    }
    
    const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
    return `${this.baseUrl}/photos/secure/${token}`;
  }

  getSignedUrlsForPhoto(
    photo: {
      thumbnailUrl: string;
      mediumUrl: string;
      fullUrl: string;
    },
    userId: number,
    cloudflareHeaders?: Record<string, string>,
  ): {
    thumbnailUrl: string;
    mediumUrl: string;
    fullUrl: string;
    expiresIn: number;
    metadata: {
      isCloudflare: boolean;
      format: string;
    };
  } {
    const isCloudflare = !!(cloudflareHeaders?.['cf-ray'] || cloudflareHeaders?.['cf-connecting-ip']);
    const expiresIn = this.isProduction && !isCloudflare ? 900 : 1800; // 15min prod, 30min dev/cloudflare
    
    // Extract format from URL for Apple apps optimization
    const format = photo.fullUrl.includes('.heic') ? 'heic' : 
                   photo.fullUrl.includes('.webp') ? 'webp' : 'jpeg';

    return {
      thumbnailUrl: this.generateSecurePhotoUrl(photo.thumbnailUrl, userId, cloudflareHeaders),
      mediumUrl: this.generateSecurePhotoUrl(photo.mediumUrl, userId, cloudflareHeaders),
      fullUrl: this.generateSecurePhotoUrl(photo.fullUrl, userId, cloudflareHeaders),
      expiresIn,
      metadata: {
        isCloudflare,
        format,
      },
    };
  }

  // New method for Apple-optimized cache headers
  getAppleOptimizedHeaders(format: string, isCloudflare: boolean = false): Record<string, string> {
    const cacheAge = isCloudflare ? 31536000 : (this.isProduction ? 2592000 : 86400); // 1y CF, 1mo prod, 1d dev
    
    return {
      'Cache-Control': `public, max-age=${cacheAge}, immutable`,
      'Content-Type': this.getMimeTypeFromFormat(format),
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
      'X-Apple-Optimized': 'true',
      'Vary': 'Accept-Encoding',
      // Apple-specific performance hints
      'X-iOS-Cache-Friendly': 'true',
      'X-Retina-Optimized': 'true',
    };
  }

  private getMimeTypeFromFormat(format: string): string {
    const mimeTypes: Record<string, string> = {
      'heic': 'image/heic',
      'heif': 'image/heif', 
      'webp': 'image/webp',
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
    };
    return mimeTypes[format] || 'image/jpeg';
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
