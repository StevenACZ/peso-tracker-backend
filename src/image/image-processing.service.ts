import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';

export interface ProcessedImageResult {
  thumbnailBuffer: Buffer;
  mediumBuffer: Buffer;
  fullBuffer: Buffer;
  format: 'heif' | 'webp' | 'jpeg';
}

export interface ImageSizes {
  thumbnail: { width: number; height: number };
  medium: { width: number; height: number };
  full: { width: number; height: number };
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  private readonly isProduction: boolean;

  // Optimized for Apple devices (Retina displays)
  private readonly imageSizes: ImageSizes = {
    thumbnail: { width: 300, height: 300 }, // @2x for 150px display
    medium: { width: 800, height: 800 }, // @2x for 400px display
    full: { width: 1600, height: 1600 }, // @2x for 800px display
  };

  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];

  constructor(private config: ConfigService) {
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';
  }

  async processImage(
    file: Express.Multer.File,
    maxFileSize: number = 10485760, // 10MB for HEIF files
  ): Promise<ProcessedImageResult> {
    // Validate file
    this.validateImageFile(file, maxFileSize);

    try {
      // Determine optimal format for processing
      const targetFormat = this.determineOptimalFormat(file.mimetype);

      // Process all sizes in parallel for performance
      const [thumbnailBuffer, mediumBuffer, fullBuffer] = await Promise.all([
        this.resizeAndOptimize(
          file.buffer,
          this.imageSizes.thumbnail,
          targetFormat,
        ),
        this.resizeAndOptimize(
          file.buffer,
          this.imageSizes.medium,
          targetFormat,
        ),
        this.resizeAndOptimize(file.buffer, this.imageSizes.full, targetFormat),
      ]);

      this.logger.log(
        `Processed image: ${targetFormat} format, original size: ${file.size}, processed sizes: ${thumbnailBuffer.length}/${mediumBuffer.length}/${fullBuffer.length}`,
      );

      return {
        thumbnailBuffer,
        mediumBuffer,
        fullBuffer,
        format: targetFormat,
      };
    } catch (error) {
      this.logger.error('Error processing image:', error);
      throw new BadRequestException(
        'Error al procesar la imagen. Verifique que el archivo sea una imagen válida.',
      );
    }
  }

  private validateImageFile(
    file: Express.Multer.File,
    maxFileSize: number,
  ): void {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se aceptan: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `Archivo muy grande. Tamaño máximo: ${Math.round(maxFileSize / 1024 / 1024)}MB`,
      );
    }
  }

  private determineOptimalFormat(
    originalMimeType: string,
  ): 'heif' | 'webp' | 'jpeg' {
    // HEIF for production (Apple ecosystem native)
    if (this.isProduction && this.supportsHeif()) {
      return 'heif';
    }

    // WebP for modern browsers in development
    if (!this.isProduction) {
      return 'webp';
    }

    // JPEG fallback for maximum compatibility
    return 'jpeg';
  }

  private async resizeAndOptimize(
    buffer: Buffer,
    size: { width: number; height: number },
    format: 'heif' | 'webp' | 'jpeg',
  ): Promise<Buffer> {
    // Use different resize strategies for different sizes
    const resizeOptions = this.getResizeStrategy(size.width);

    const sharpInstance = sharp(buffer).resize(
      size.width,
      size.height,
      resizeOptions,
    );

    switch (format) {
      case 'heif':
        return sharpInstance
          .heif({
            quality: this.getQualityForSize(size.width),
            compression: 'av1', // Best compression for Apple
          })
          .toBuffer();

      case 'webp':
        return sharpInstance
          .webp({
            quality: this.getQualityForSize(size.width),
            effort: 4, // Balance quality/speed
          })
          .toBuffer();

      case 'jpeg':
      default:
        return sharpInstance
          .jpeg({
            quality: this.getQualityForSize(size.width),
            progressive: true, // Better for mobile
            mozjpeg: true, // Better compression
          })
          .toBuffer();
    }
  }

  private getResizeStrategy(width: number): {
    fit: 'cover' | 'inside';
    position?: string;
  } {
    // Thumbnail: Keep square for consistent UI grid
    if (width <= 300) {
      return {
        fit: 'cover',
        position: 'center',
      };
    }

    // Medium & Full: Preserve original proportions for progress photos
    return {
      fit: 'inside', // Preserves aspect ratio, fits within dimensions
    };
  }

  private getQualityForSize(width: number): number {
    // Higher quality for smaller images (better compression ratio)
    if (width <= 300) return 85; // Thumbnail
    if (width <= 800) return 80; // Medium
    return 75; // Full size
  }

  private supportsHeif(): boolean {
    try {
      // Check if Sharp supports HEIF (requires libheif)
      return sharp.format.heif.input.buffer;
    } catch {
      this.logger.warn('HEIF support not available, falling back to WebP/JPEG');
      return false;
    }
  }

  getFileExtension(format: 'heif' | 'webp' | 'jpeg'): string {
    const extensions = {
      heif: 'heic', // Apple convention
      webp: 'webp',
      jpeg: 'jpg',
    };
    return extensions[format];
  }

  getMimeType(format: 'heif' | 'webp' | 'jpeg'): string {
    const mimeTypes = {
      heif: 'image/heic',
      webp: 'image/webp',
      jpeg: 'image/jpeg',
    };
    return mimeTypes[format];
  }

  // Utility for getting optimized cache headers
  getCacheHeaders(format: 'heif' | 'webp' | 'jpeg'): Record<string, string> {
    const oneYear = 31536000; // 1 year in seconds
    const oneMonth = 2592000; // 1 month in seconds

    return {
      'Cache-Control': this.isProduction
        ? `public, max-age=${oneYear}, immutable`
        : `public, max-age=${oneMonth}`,
      'Content-Type': this.getMimeType(format),
      'X-Content-Type-Options': 'nosniff',
      // Apple-specific optimization headers
      'Accept-Ranges': 'bytes',
      'X-Apple-Optimized': 'true',
    };
  }
}
