import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    // Feature modülleri (sprint sırasına göre eklenecek — Doc 13):
    // CatalogModule, QuizModule, ProgressModule, SubscriptionModule...
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
