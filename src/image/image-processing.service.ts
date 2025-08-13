import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';

export interface ProcessedImageResult {
  thumbnailBuffer: Buffer;
  mediumBuffer: Buffer;
  fullBuffer: Buffer;
  format: 'webp';
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

  // Optimized for high-DPI displays
  private readonly imageSizes: ImageSizes = {
    thumbnail: { width: 300, height: 300 }, // High resolution for thumbnails
    medium: { width: 800, height: 800 }, // High resolution for medium view
    full: { width: 1600, height: 1600 }, // High resolution for full view
  };

  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  constructor(private config: ConfigService) {
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';
  }

  async processImage(
    file: Express.Multer.File,
    maxFileSize: number = 10485760, // 10MB max file size
  ): Promise<ProcessedImageResult> {
    // Validate file
    this.validateImageFile(file, maxFileSize);

    try {
      // Always use WebP for universal compatibility and efficiency
      const targetFormat = 'webp';

      // Pre-process large images to prevent memory issues
      const processedBuffer = await this.preProcessLargeImage(file.buffer);

      this.logger.log(
        `Processing image: original size ${file.size}, after pre-processing: ${processedBuffer.length}`,
      );

      // Process all sizes in parallel for performance
      const [thumbnailBuffer, mediumBuffer, fullBuffer] = await Promise.all([
        this.resizeAndOptimize(processedBuffer, this.imageSizes.thumbnail),
        this.resizeAndOptimize(processedBuffer, this.imageSizes.medium),
        this.resizeAndOptimize(processedBuffer, this.imageSizes.full),
      ]);

      this.logger.log(
        `Processed image: ${targetFormat} format, original size: ${file.size}, processed sizes: ${thumbnailBuffer.length}/${mediumBuffer.length}/${fullBuffer.length}`,
      );

      // Log memory usage for debugging
      const memUsage = process.memoryUsage();
      this.logger.log(
        `Memory usage after processing: RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      );

      return {
        thumbnailBuffer,
        mediumBuffer,
        fullBuffer,
        format: targetFormat,
      };
    } catch (error) {
      this.logger.error('Error processing image:', {
        error: error.message,
        fileSize: file.size,
        mimetype: file.mimetype,
        memoryUsage: process.memoryUsage(),
      });

      // More specific error messages for debugging
      if (
        error.message?.includes(
          'Input buffer contains unsupported image format',
        )
      ) {
        throw new BadRequestException('Formato de imagen no soportado');
      }
      if (
        error.message?.includes('Cannot allocate memory') ||
        error.message?.includes('out of memory')
      ) {
        throw new BadRequestException(
          'Imagen demasiado grande para procesar. Intente con una imagen más pequeña.',
        );
      }

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

  private async resizeAndOptimize(
    buffer: Buffer,
    size: { width: number; height: number },
  ): Promise<Buffer> {
    // Use different resize strategies for different sizes
    const resizeOptions = this.getResizeStrategy(size.width);

    const sharpInstance = sharp(buffer).resize(
      size.width,
      size.height,
      resizeOptions,
    );

    return sharpInstance
      .webp({
        quality: this.getQualityForSize(size.width),
        effort: 4, // Balance quality/speed
      })
      .toBuffer();
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

  private async preProcessLargeImage(buffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(buffer).metadata();
      const { width = 0, height = 0 } = metadata;

      // Log image info for debugging
      this.logger.log(
        `Image metadata: ${width}x${height}, format: ${metadata.format}, size: ${buffer.length}`,
      );

      // If image is very large (>3MP or >5MB), pre-resize to reduce memory footprint
      const megapixels = (width * height) / 1000000;
      const isLargeImage = megapixels > 3 || buffer.length > 5242880; // 5MB

      if (isLargeImage) {
        this.logger.log(
          `Pre-processing large image: ${megapixels.toFixed(1)}MP, ${Math.round(buffer.length / 1024 / 1024)}MB`,
        );

        // Calculate max dimensions to keep reasonable memory usage
        const maxDimension = 2048; // Max width or height for pre-processing
        let resizeWidth: number | undefined;
        let resizeHeight: number | undefined;

        if (width > height) {
          if (width > maxDimension) {
            resizeWidth = maxDimension;
            resizeHeight = Math.round((height * maxDimension) / width);
          }
        } else {
          if (height > maxDimension) {
            resizeHeight = maxDimension;
            resizeWidth = Math.round((width * maxDimension) / height);
          }
        }

        const preprocessed = await sharp(buffer)
          .resize(resizeWidth, resizeHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 90 }) // High quality intermediate format
          .toBuffer();

        this.logger.log(
          `Pre-processing completed: ${Math.round(preprocessed.length / 1024 / 1024)}MB (${Math.round((1 - preprocessed.length / buffer.length) * 100)}% reduction)`,
        );
        return preprocessed;
      }

      // For smaller images, just strip metadata to reduce size
      return await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .withMetadata() // Keep minimal metadata
        .toBuffer();
    } catch (error) {
      this.logger.warn(
        'Pre-processing failed, using original buffer:',
        error.message,
      );
      return buffer; // Fallback to original
    }
  }

  getFileExtension(): string {
    return 'webp';
  }

  getMimeType(): string {
    return 'image/webp';
  }

  // Utility for getting optimized cache headers
  getCacheHeaders(): Record<string, string> {
    const oneYear = 31536000; // 1 year in seconds
    const oneMonth = 2592000; // 1 month in seconds

    return {
      'Cache-Control': this.isProduction
        ? `public, max-age=${oneYear}, immutable`
        : `public, max-age=${oneMonth}`,
      'Content-Type': this.getMimeType(),
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
    };
  }
}
