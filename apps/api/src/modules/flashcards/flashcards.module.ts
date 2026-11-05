import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProgressModule } from '../progress/progress.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';

/// Bilgi kartları (Doc 56): kullanıcı uçları ve oda sayımları. Admin uçları AdminModule'de (aşama 6).
@Module({
  // ProgressModule: seri (karar 6); NotificationsModule: olay omurgası (flashcard_session_completed).
  imports: [AuthModule, ProgressModule, NotificationsModule],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
