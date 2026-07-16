import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

/// Public SEO/funnel uçları (Doc 23) — paemisyon.com'un girişsiz katmanı.
@Module({
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
