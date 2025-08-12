import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  blocked: boolean;
}

@Injectable()
export class PhotoRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(PhotoRateLimitGuard.name);
  private readonly requests = new Map<string, RateLimitInfo>();

  // Rate limiting settings
  private readonly maxRequestsPerMinute = 100; // Max 100 photo requests per minute per IP
  private readonly maxFailedAttempts = 10; // Max 10 failed attempts per minute per IP
  private readonly windowMs = 60 * 1000; // 1 minute window
  private readonly blockDurationMs = 15 * 60 * 1000; // Block for 15 minutes after too many failures

  // Clean up old entries every 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';

    const now = Date.now();
    const key = `${ip}:${userAgent.substring(0, 50)}`; // Include user agent to prevent simple IP rotation

    let rateLimitInfo = this.requests.get(key);

    if (!rateLimitInfo) {
      rateLimitInfo = {
        count: 0,
        resetTime: now + this.windowMs,
        blocked: false,
      };
    }

    // Check if currently blocked
    if (rateLimitInfo.blocked && now < rateLimitInfo.resetTime) {
      this.logger.warn(`Blocked request from ${ip} - still in block period`, {
        ip,
        userAgent,
        remainingBlockTime: rateLimitInfo.resetTime - now,
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
          retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Reset window if expired
    if (now > rateLimitInfo.resetTime) {
      rateLimitInfo = {
        count: 0,
        resetTime: now + this.windowMs,
        blocked: false,
      };
    }

    // Increment request count
    rateLimitInfo.count++;

    // Check if exceeded rate limit
    if (rateLimitInfo.count > this.maxRequestsPerMinute) {
      rateLimitInfo.blocked = true;
      rateLimitInfo.resetTime = now + this.blockDurationMs;

      this.logger.error(
        `Rate limit exceeded for ${ip} - blocking for 15 minutes`,
        {
          ip,
          userAgent,
          requestCount: rateLimitInfo.count,
          maxAllowed: this.maxRequestsPerMinute,
        },
      );

      this.requests.set(key, rateLimitInfo);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Límite de solicitudes excedido. Acceso bloqueado temporalmente.',
          retryAfter: Math.ceil(this.blockDurationMs / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.requests.set(key, rateLimitInfo);

    // Log warning when approaching limit
    if (rateLimitInfo.count > this.maxRequestsPerMinute * 0.8) {
      this.logger.warn(`High request rate from ${ip}`, {
        ip,
        userAgent,
        requestCount: rateLimitInfo.count,
        maxAllowed: this.maxRequestsPerMinute,
      });
    }

    return true;
  }

  // Method to increment failed attempts (called from controller on auth failures)
  recordFailedAttempt(request: Request): void {
    const ip = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const key = `failed:${ip}:${userAgent.substring(0, 50)}`;
    const now = Date.now();

    let failureInfo = this.requests.get(key);

    if (!failureInfo) {
      failureInfo = {
        count: 0,
        resetTime: now + this.windowMs,
        blocked: false,
      };
    }

    // Reset window if expired
    if (now > failureInfo.resetTime) {
      failureInfo = {
        count: 0,
        resetTime: now + this.windowMs,
        blocked: false,
      };
    }

    failureInfo.count++;

    if (failureInfo.count >= this.maxFailedAttempts) {
      failureInfo.blocked = true;
      failureInfo.resetTime = now + this.blockDurationMs;

      this.logger.error(`Too many failed attempts from ${ip} - blocking`, {
        ip,
        userAgent,
        failedAttempts: failureInfo.count,
        maxAllowed: this.maxFailedAttempts,
      });
    }

    this.requests.set(key, failureInfo);
  }

  private getClientIp(request: Request): string {
    // Handle various proxy headers
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const cfConnectingIp = request.headers['cf-connecting-ip'] as string; // Cloudflare

    if (cfConnectingIp) return cfConnectingIp;
    if (realIp) return realIp;
    if (forwarded) return forwarded.split(',')[0].trim();

    return (
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.requests.forEach((info, key) => {
      if (now > info.resetTime && !info.blocked) {
        this.requests.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedCount} expired rate limit entries`,
      );
    }
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
