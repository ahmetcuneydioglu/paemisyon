import { Module } from '@nestjs/common';
import { CourseTestsController } from './course-tests.controller';
import { CourseTestsService } from './course-tests.service';

@Module({
  controllers: [CourseTestsController],
  providers: [CourseTestsService],
  exports: [CourseTestsService],
})
export class CourseTestsModule {}
