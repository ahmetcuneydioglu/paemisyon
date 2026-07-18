import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

/** Her origin için www↔apex karşılığını da üretir (CORS eşleşmesi için). */
function withWwwVariants(origins: string[]): string[] {
  const set = new Set<string>();
  for (const o of origins) {
    if (!o) continue;
    set.add(o);
    try {
      const u = new URL(o);
      const host = u.host.startsWith('www.') ? u.host.slice(4) : `www.${u.host}`;
      set.add(`${u.protocol}//${host}`);
    } catch {
      /* geçersiz origin — olduğu gibi bırak */
    }
  }
  return [...set];
}

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
  // env yoksa (dev) tüm origin'lere izin ver. Her origin'in www↔apex karşılığı
  // OTOMATİK eklenir: site www.paemisyon.com'dan sunulup env'de yalnız apex
  // yazsa (veya tersi) tarayıcı istekleri CORS'a takılmasın (Doc 22 canlıya alma).
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins ? withWwwVariants(corsOrigins.split(',').map((o) => o.trim())) : true,
    credentials: true,
    // Quiz cevapları Authorization + JSON nedeniyle preflight üretir. Sonucu
    // tarayıcıda önbellekle; her şıkta fazladan API gidiş-dönüşü yapma.
    maxAge: 86_400,
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`Paemisyon API çalışıyor: http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
