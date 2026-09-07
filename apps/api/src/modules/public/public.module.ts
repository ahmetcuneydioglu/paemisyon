import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { CikmisSinavService } from './cikmis-sinav.service';
import { MevzuatService } from './mevzuat.service';
import { PublicService } from './public.service';

/// Public SEO/funnel uçları (Doc 23) — paemisyon.com'un girişsiz katmanı.
@Module({
  controllers: [PublicController],
  providers: [PublicService, MevzuatService, CikmisSinavService],
  exports: [MevzuatService, CikmisSinavService],
})
export class PublicModule {}
