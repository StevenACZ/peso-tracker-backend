import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 5;
  private readonly initialRetryDelay = 1000; // 1 second

  constructor(private config: ConfigService) {
    // Get optimized connection settings for VPS multi-service environment
    const databaseUrl = new URL(config.get<string>('database.url') || '');
    const isProduction = config.get<string>('nodeEnv') === 'production';

    // VPS-optimized connection settings (higher limits than constrained hosting)
    const connectionLimit = isProduction ? '8' : '5'; // Higher for VPS
    const poolTimeout = isProduction ? '5' : '3'; // More generous timeout
    const connectTimeout = isProduction ? '15' : '10'; // Longer connect timeout

    databaseUrl.searchParams.set('connection_limit', connectionLimit);
    databaseUrl.searchParams.set('pool_timeout', poolTimeout);
    databaseUrl.searchParams.set('connect_timeout', connectTimeout);

    // For VPS deployments, SSL may not be required if using internal PostgreSQL
    if (
      isProduction &&
      databaseUrl.hostname !== 'localhost' &&
      databaseUrl.hostname !== 'postgres'
    ) {
      databaseUrl.searchParams.set('sslmode', 'require');
    }

    super({
      log: [
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      datasources: {
        db: {
          url: databaseUrl.toString(),
        },
      },
    });
  }

  async onModuleInit() {
    const isProduction = this.config.get<string>('nodeEnv') === 'production';
    const databaseUrl = this.config.get<string>('database.url') || '';
    const dbHost = new URL(databaseUrl).hostname;

    this.logger.log(
      `Initializing Prisma connection to ${dbHost} (${isProduction ? 'production' : 'development'} mode)`,
    );
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Connect to the database with exponential backoff retry strategy
   */
  private async connectWithRetry(
    retryCount = 0,
    delay = this.initialRetryDelay,
  ): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error: any) {
      if (retryCount >= this.maxRetries) {
        this.logger.error(
          `Failed to connect to database after ${this.maxRetries} attempts`,
        );
        throw error;
      }

      this.logger.warn(
        `Failed to connect to database. Retrying in ${delay / 1000} seconds... (Attempt ${retryCount + 1}/${
          this.maxRetries
        })`,
      );

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry with exponential backoff
      return this.connectWithRetry(retryCount + 1, delay * 2);
    }
  }

  /**
   * Helper method to execute database operations with error handling
   * @param operation Function that performs database operation
   * @returns Result of the operation
   */
  async executeOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      this.logger.error(`Database operation failed: ${error.message}`);

      // Check if it's a connection error and try to reconnect
      if (error.code === 'P1001' || error.code === 'P1002') {
        this.logger.warn(
          'Connection error detected, attempting to reconnect...',
        );
        await this.connectWithRetry();
      }

      throw error;
    }
  }

  /**
   * Get database connection info for monitoring
   * Useful for VPS multi-service environments
   */
  getConnectionInfo() {
    const databaseUrl = this.config.get<string>('database.url') || '';
    const parsedUrl = new URL(databaseUrl);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port || '5432',
      database: parsedUrl.pathname.substring(1),
      ssl: parsedUrl.searchParams.get('sslmode') === 'require',
      connectionLimit:
        parsedUrl.searchParams.get('connection_limit') || 'default',
      environment: this.config.get<string>('nodeEnv') || 'development',
    };
  }

  /**
   * Test database connection with detailed response time
   */
  async testConnection(): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.$queryRaw`SELECT 1 as test`;
      const responseTime = Date.now() - startTime;

      return { success: true, responseTime };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database connection test failed:', error.message);

      return {
        success: false,
        responseTime,
        error: error.message,
      };
    }
  }
}
