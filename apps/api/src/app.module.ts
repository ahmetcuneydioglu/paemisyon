import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { istekKimligi } from './common/istek-kimligi';
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
import { AiModule } from './modules/ai/ai.module';
import { PublicModule } from './modules/public/public.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
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
    // Genel istek hız sınırı (Doc 18 §güvenlik). İKİ katman:
    //  1) 'kimlik' — kullanıcı başına 300/dk. Kalabalık bir canlı denemede
    //     onlarca kişi tek mobil operatör NAT'ı (ya da tek okul ağı) arkasından
    //     girer; sayaç IP'ye bağlı kalırsa hepsi aynı kovayı paylaşıp 429 yer.
    //  2) 'ip' — IP başına 1500/dk. Birinci katmanın anahtarı DOĞRULANMAMIŞ
    //     JWT sub'ından geldiği için, uydurma sub üretip limitten kaçmayı bu
    //     geniş tavan kapatır. Kalabalık NAT'ı (50 kişi ≈ 300 istek/dk) rahat
    //     geçirir, tek makineden gelen selin önünü keser.
    // Sayaçlar uç bazlıdır (generateKey sınıf+handler içerir); hassas uçlar
    // @Throttle ile daha sıkı (örn. soru öner 5/dk).
    ThrottlerModule.forRoot({
      errorMessage: 'Çok fazla istek gönderildi. Birkaç saniye sonra tekrar dene.',
      throttlers: [
        { name: 'kimlik', ttl: 60_000, limit: 300, getTracker: (req) => istekKimligi(req) },
        {
          name: 'ip',
          ttl: 60_000,
          limit: 1500,
          getTracker: (req) => `ip:${req.ip ?? 'bilinmiyor'}`,
        },
      ],
    }),
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
    AiModule,
    AdminModule,
    HealthModule,
    UsersModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Her isteğe trace_id iliştir (log korelasyonu — Doc 7)
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
