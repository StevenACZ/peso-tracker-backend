import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private supabase: SupabaseClient;

  constructor(private prisma: PrismaService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
  }

  async check() {
    const timestamp = new Date().toISOString();

    const [database, supabase] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkSupabase(),
    ]);

    const status =
      database.status === 'fulfilled' &&
      supabase.status === 'fulfilled' &&
      database.value.status === 'healthy' &&
      supabase.value.status === 'healthy'
        ? 'healthy'
        : 'unhealthy';

    return {
      status,
      timestamp,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database:
          database.status === 'fulfilled'
            ? database.value
            : { status: 'unhealthy', error: database.reason },
        supabase:
          supabase.status === 'fulfilled'
            ? supabase.value
            : { status: 'unhealthy', error: supabase.reason },
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

  async checkSupabase() {
    try {
      const startTime = Date.now();

      // Test Supabase connection by trying to get user (will fail but connection works)
      await this.supabase.auth.getUser();

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        message: 'Supabase connection successful',
      };
    } catch (error) {
      // If it's an auth error, Supabase is actually working
      if (
        error.message?.includes('JWT') ||
        error.message?.includes('session')
      ) {
        return {
          status: 'healthy',
          message: 'Supabase connection successful',
        };
      }

      this.logger.error('Supabase health check failed:', error);
      return {
        status: 'unhealthy',
        message: 'Supabase connection failed',
        error: error.message,
      };
    }
  }
}
