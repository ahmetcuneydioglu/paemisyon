import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';

/// Bilgi kartları (Doc 56): kullanıcı uçları ve oda sayımları. Admin uçları AdminModule'de (aşama 6).
@Module({
  imports: [AuthModule],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
