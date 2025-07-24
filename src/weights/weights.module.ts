import { Module } from '@nestjs/common';
import { WeightsController } from './weights.controller';
import { WeightsService } from './weights.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WeightsController],
  providers: [WeightsService],
})
export class WeightsModule {}
