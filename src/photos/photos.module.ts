import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PhotosController } from './photos.controller';
import { StorageModule } from '../storage/storage.module';
import { PhotoRateLimitGuard } from '../security/rate-limiting.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    StorageModule,
    PrismaModule,
  ],
  controllers: [PhotosController],
  providers: [PhotoRateLimitGuard],
  exports: [PhotoRateLimitGuard],
})
export class PhotosModule {}
