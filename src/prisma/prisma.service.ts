import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 5;
  private readonly initialRetryDelay = 1000; // 1 second

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // Log query events in development mode
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (e) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log errors
    this.$on('error', (e) => {
      this.logger.error(`Database error: ${e.message}`);
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Connect to the database with exponential backoff retry strategy
   */
  private async connectWithRetry(retryCount = 0, delay = this.initialRetryDelay): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      if (retryCount >= this.maxRetries) {
        this.logger.error(`Failed to connect to database after ${this.maxRetries} attempts`);
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
    } catch (error) {
      this.logger.error(`Database operation failed: ${error.message}`);
      
      // Check if it's a connection error and try to reconnect
      if (error.code === 'P1001' || error.code === 'P1002') {
        this.logger.warn('Connection error detected, attempting to reconnect...');
        await this.connectWithRetry();
      }
      
      throw error;
    }
  }
}