import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly uploadsPath: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadsPath =
      this.config.get<string>('UPLOADS_PATH') || '/app/uploads';
  }

  async check() {
    const timestamp = new Date().toISOString();

    const [database, storage] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkStorage(),
    ]);

    const status =
      database.status === 'fulfilled' &&
      storage.status === 'fulfilled' &&
      database.value.status === 'healthy' &&
      storage.value.status === 'healthy'
        ? 'healthy'
        : 'unhealthy';

    return {
      status,
      timestamp,
      uptime: process.uptime(),
      environment: this.config.get<string>('NODE_ENV') || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database:
          database.status === 'fulfilled'
            ? database.value
            : { status: 'unhealthy', error: database.reason },
        storage:
          storage.status === 'fulfilled'
            ? storage.value
            : { status: 'unhealthy', error: storage.reason },
      },
    };
  }

  async checkDatabase() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        message: 'Database connection successful',
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }

  async checkStorage() {
    try {
      const startTime = Date.now();

      // Check if uploads directory exists and is writable
      await fs.access(this.uploadsPath, fs.constants.F_OK | fs.constants.W_OK);

      // Test by creating a temporary file
      const testFile = path.join(this.uploadsPath, '.health-check');
      await fs.writeFile(testFile, 'health-check');
      await fs.unlink(testFile);

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        message: 'File storage accessible and writable',
        path: this.uploadsPath,
      };
    } catch (error) {
      this.logger.error('Storage health check failed:', error);

      // Try to create directory if it doesn't exist
      try {
        await fs.mkdir(this.uploadsPath, { recursive: true });
        return {
          status: 'healthy',
          message: 'Storage directory created successfully',
          path: this.uploadsPath,
        };
      } catch (createError) {
        return {
          status: 'unhealthy',
          message: 'Storage directory not accessible',
          error: createError.message,
          path: this.uploadsPath,
        };
      }
    }
  }
}
