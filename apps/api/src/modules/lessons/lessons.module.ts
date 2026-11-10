import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AdminLessonsController,
  MeLessonsController,
  PublicLessonsController,
} from './lessons.controller';
import { LessonsService } from './lessons.service';

/// Konu anlatımı (Doc 57): public okuma + kullanıcı ilerlemesi + asgari panel uçları.
@Module({
  imports: [AuthModule],
  controllers: [PublicLessonsController, MeLessonsController, AdminLessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
