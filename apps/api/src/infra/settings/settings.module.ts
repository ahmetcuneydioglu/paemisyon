import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';

/// Uygulama ayarları — global: quiz/exams okur, admin yazar.
@Global()
@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
