import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // API versiyonlama (Doc 7): tüm uçlar /api/v1 altında
  app.setGlobalPrefix('api/v1');

  // Girdi doğrulama sınırda; iç katman temiz kalır (Doc 3)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Tutarlı yanıt/hata formatı (Doc 7)
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS: prod'da yalnız izinli origin'ler (CORS_ORIGINS, virgülle ayrılmış);
  // env yoksa (dev) tüm origin'lere izin ver.
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`Paemisyon API çalışıyor: http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
