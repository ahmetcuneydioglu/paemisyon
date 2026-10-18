import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [PlanModule], // okuma süresi → plan kalemi (F8-A)
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
