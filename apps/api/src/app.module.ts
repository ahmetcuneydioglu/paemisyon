import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { ExamsModule } from './modules/exams/exams.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthModule } from './modules/health/health.module';
import { ProgressModule } from './modules/progress/progress.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReviewModule } from './modules/review/review.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    QuizModule,
    ProgressModule,
    ReviewModule,
    ReportsModule,
    BillingModule,
    ExamsModule,
    AdminModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Her isteğe trace_id iliştir (log korelasyonu — Doc 7)
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
