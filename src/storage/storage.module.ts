import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ImageModule } from '../image/image.module';

@Module({
  imports: [ImageModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
