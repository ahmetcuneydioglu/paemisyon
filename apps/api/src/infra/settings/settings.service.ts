import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Ayar anahtarları — tek yerde (yazım hatasına derleme engeli). */
export const SETTING_KEYS = {
  /// Soru kaynağı etiketi ("30 Kasım 2025 Adalet Bakanlığı GYS") kullanıcıya
  /// gösterilsin mi? Panelden aç/kapa; kapalıyken payload'a hiç yazılmaz.
  showQuestionSource: 'show_question_source',
  /// Bugün ekranındaki "Çıkmış sınavlar" keşif kartı (Doc 36) açık mı?
  /// Varsayılanı KAPALI: kart, ekranı içeren mağaza sürümü yayına çıkmadan
  /// önce açılırsa güncellemeyen kullanıcı Denemeler listesine düşer ve
  /// kartın verdiği sözü ekranda bulamaz.
  coachCikmisSinavKarti: 'coach_cikmis_sinav_karti',
} as const;

/**
 * Kaynak etiketinin VARSAYILANI kapalıdır (kullanıcı kararı, 4 Eylül 2026):
 * etiket hiçbir son kullanıcıya gösterilmez, yalnız panelde admin görür.
 * Varsayılan "açık" kalsaydı ayar satırı silindiğinde ya da yeni bir ortam
 * kurulduğunda etiket sessizce sızardı.
 */
export const SHOW_QUESTION_SOURCE_DEFAULT = false;
export const COACH_CIKMIS_SINAV_KARTI_DEFAULT = false;

const CACHE_MS = 60_000;

/**
 * Uygulama ayarları (app_settings anahtar-değer). Sık okunan yol (her cevap
 * gösterimi) için 60 sn bellek önbelleği — panel değişikliği en geç 1 dk
 * içinde tüm istemcilere yansır.
 */
@Injectable()
export class SettingsService {
  private cache: { values: Map<string, string>; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async all(): Promise<Map<string, string>> {
    if (this.cache && Date.now() < this.cache.expiresAt) return this.cache.values;
    const rows = await this.prisma.appSetting.findMany();
    const values = new Map(rows.map((r) => [r.key, r.value]));
    this.cache = { values, expiresAt: Date.now() + CACHE_MS };
    return values;
  }

  /** Kaynak etiketi gösterilsin mi? Tek karar noktası — varsayılan KAPALI. */
  async showQuestionSource(): Promise<boolean> {
    return this.getBool(SETTING_KEYS.showQuestionSource, SHOW_QUESTION_SOURCE_DEFAULT);
  }

  /** Çıkmış sınav keşif kartı açık mı? Varsayılan KAPALI (mağaza sürümü şartı). */
  async coachCikmisSinavKarti(): Promise<boolean> {
    return this.getBool(
      SETTING_KEYS.coachCikmisSinavKarti,
      COACH_CIKMIS_SINAV_KARTI_DEFAULT,
    );
  }

  async getBool(key: string, fallback: boolean): Promise<boolean> {
    const v = (await this.all()).get(key);
    return v == null ? fallback : v === 'true' || v === '1';
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    this.cache = null; // bu süreçte anında yansısın
  }
}
