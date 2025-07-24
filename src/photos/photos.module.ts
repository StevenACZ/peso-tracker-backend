import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos de imagen'), false);
        }
      },
    }),
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}