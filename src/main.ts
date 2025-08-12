import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import * as compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust proxy for Cloudflare Tunnels - enables real IP detection
  app.set('trust proxy', true);

  // Increase timeout for image processing (especially large iPhone photos)
  app.use((req, res, next) => {
    // Set longer timeout for upload endpoints
    if (req.path.includes('/weights') && req.method === 'POST' || req.method === 'PATCH') {
      req.setTimeout(120000); // 2 minutes for image processing
      res.setTimeout(120000);
    }
    next();
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = configService.get<number>('port');
  const nodeEnv = configService.get<string>('nodeEnv');
  const isProduction = configService.get<boolean>('isProduction');
  const corsConfig = configService.get('cors');

  // Compression middleware (reduce response sizes)
  app.use(
    compression({
      threshold: 1024, // Only compress responses > 1KB
      level: 6, // Balance between compression ratio and CPU usage
    }),
  );

  // Security middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: !isProduction,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: corsConfig.origin,
    credentials: corsConfig.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Static file serving for uploads
  const uploadsPath =
    configService.get<string>('storage.uploadsPath') || '/app/uploads';
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res) => {
      // Cache images for 1 day
      res.set('Cache-Control', 'public, max-age=86400');
    },
  });
  logger.log(`Static files served from: ${uploadsPath} at /uploads/`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI setup (only in development)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Peso Tracker API')
      .setDescription('Documentación de la API de Peso Tracker')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    logger.log(
      `Swagger documentation available at http://localhost:${port}/api/docs`,
    );
  }

  await app.listen(port || 3000);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((err) => {
  console.error('Error starting application:', err);
  process.exit(1);
});
