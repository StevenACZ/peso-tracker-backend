import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as sharp from 'sharp';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    this.bucketName =
      process.env.SUPABASE_STORAGE_BUCKET || 'peso-tracker-photos';
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
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const baseFileName = `${userId}/${weightId}/${timestamp}`;

    try {
      // Process images in different sizes
      const [thumbnailBuffer, mediumBuffer, fullBuffer] = await Promise.all([
        this.resizeImage(file.buffer, 150, 150),
        this.resizeImage(file.buffer, 400, 400),
        this.resizeImage(file.buffer, 800, 800),
      ]);

      // Upload all sizes
      const [thumbnailPath, mediumPath, fullPath] = await Promise.all([
        this.uploadBuffer(
          thumbnailBuffer,
          `${baseFileName}_thumbnail.${fileExtension}`,
        ),
        this.uploadBuffer(
          mediumBuffer,
          `${baseFileName}_medium.${fileExtension}`,
        ),
        this.uploadBuffer(fullBuffer, `${baseFileName}_full.${fileExtension}`),
      ]);

      // Generate signed URLs for all sizes
      const [thumbnailSignedUrl, mediumSignedUrl, fullSignedUrl] =
        await Promise.all([
          this.createSignedUrl(thumbnailPath.filePath),
          this.createSignedUrl(mediumPath.filePath),
          this.createSignedUrl(fullPath.filePath),
        ]);

      return {
        thumbnailUrl: thumbnailSignedUrl,
        mediumUrl: mediumSignedUrl,
        fullUrl: fullSignedUrl,
      };
    } catch (error) {
      this.logger.error('Error uploading image:', error);
      throw new Error('Error al subir la imagen');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userFolder = urlParts[urlParts.length - 3];
      const weightFolder = urlParts[urlParts.length - 2];
      const filePath = `${userFolder}/${weightFolder}/${fileName}`;

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error('Error deleting image:', error);
        throw new Error('Error al eliminar la imagen');
      }
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
      const folderPath = `${userId}/${weightId}/`;

      // List all files in the folder
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderPath);

      if (listError) {
        this.logger.error('Error listing files:', listError);
        return;
      }

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${folderPath}${file.name}`);

        const { error: deleteError } = await this.supabase.storage
          .from(this.bucketName)
          .remove(filePaths);

        if (deleteError) {
          this.logger.error('Error deleting files:', deleteError);
        }
      }
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

  private async uploadBuffer(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ filePath: string }> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return { filePath: fileName };
  }

  private async createSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) {
      this.logger.error('Error creating signed URL:', error);
      throw new Error('Error al crear URL firmada');
    }

    return data.signedUrl;
  }

  async getSignedUrlsForPhoto(photo: {
    thumbnailUrl: string;
    mediumUrl: string;
    fullUrl: string;
  }): Promise<{
    thumbnailUrl: string;
    mediumUrl: string;
    fullUrl: string;
  }> {
    try {
      // Extract file paths from stored URLs
      const thumbnailPath = this.extractFilePathFromUrl(photo.thumbnailUrl);
      const mediumPath = this.extractFilePathFromUrl(photo.mediumUrl);
      const fullPath = this.extractFilePathFromUrl(photo.fullUrl);

      // Generate new signed URLs
      const [thumbnailSignedUrl, mediumSignedUrl, fullSignedUrl] =
        await Promise.all([
          this.createSignedUrl(thumbnailPath),
          this.createSignedUrl(mediumPath),
          this.createSignedUrl(fullPath),
        ]);

      return {
        thumbnailUrl: thumbnailSignedUrl,
        mediumUrl: mediumSignedUrl,
        fullUrl: fullSignedUrl,
      };
    } catch (error) {
      this.logger.error('Error getting signed URLs for photo:', error);
      throw new Error('Error al obtener URLs firmadas');
    }
  }

  private extractFilePathFromUrl(url: string): string {
    // Extract file path from public URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const userFolder = urlParts[urlParts.length - 3];
    const weightFolder = urlParts[urlParts.length - 2];
    return `${userFolder}/${weightFolder}/${fileName}`;
  }
}
