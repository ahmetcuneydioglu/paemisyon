import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CourseTestsModule } from '../course-tests/course-tests.module';

@Module({ imports: [CourseTestsModule], controllers: [RoomsController], providers: [RoomsService] })
export class RoomsModule {}
