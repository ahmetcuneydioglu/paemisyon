import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';
import { PrismaModule } from './infra/prisma/prisma.module';
import { SettingsModule } from './infra/settings/settings.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CoachModule } from './modules/coach/coach.module';
import { ExamsModule } from './modules/exams/exams.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthModule } from './modules/health/health.module';
import { ProgressModule } from './modules/progress/progress.module';
import { PublicModule } from './modules/public/public.module';
import { QuestionsModule } from './modules/questions/questions.module';
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
    // Genel istek hız sınırı (Doc 18 §güvenlik): IP başına 300/dk (normal
    // kullanım + sınav akışı için rahat); hassas uçlar @Throttle ile daha sıkı
    // (örn. soru öner 5/dk).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    ScheduleModule.forRoot(), // haftalık mastery fotoğrafı (Doc 19)
    PrismaModule,
    SettingsModule,
    AuthModule,
    CatalogModule,
    QuizModule,
    ProgressModule,
    ReviewModule,
    ReportsModule,
    BillingModule,
    CoachModule,
    ExamsModule,
    QuestionsModule,
    PublicModule,
    AdminModule,
    HealthModule,
    UsersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Her isteğe trace_id iliştir (log korelasyonu — Doc 7)
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
