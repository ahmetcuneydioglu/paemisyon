import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CourseTestsModule } from '../course-tests/course-tests.module';
import { FlashcardsModule } from '../flashcards/flashcards.module';

@Module({
  imports: [CourseTestsModule, FlashcardsModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
