/**
 * Analitik Akıl Yürütme · 4. parti — 8 senaryo × 3 soru (Doc 43, 23 Eyl 2026).
 *
 * Her senaryo kendi modülünde (aay-p4-s1 … aay-p4-s8); bu dosya onları partinin
 * sırasıyla toplar. Hedef, bankada karşılığı olmayan PAEM 10 soru ailesi
 * (çok nitelikli gruplama + sayım kısıtı) ile Roma rakamlı ve yeterlilik
 * biçimleriydi. Her senaryo üç kapıdan geçti: çözücü kanıtı (aay-cozucu),
 * yalnız Türkçe metni görerek bütün durumları sayan kör çözücü ve kod↔metin
 * denetçisi (belirsiz cümleler öbür okumalarıyla yeniden koşuldu).
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4
 *   npx tsx scripts/aay-bankaya-yaz.ts aay-p4          (kuru)
 */
import { PARTI as S1 } from './aay-p4-s1';
import { PARTI as S2 } from './aay-p4-s2';
import { PARTI as S3 } from './aay-p4-s3';
import { PARTI as S4 } from './aay-p4-s4';
import { PARTI as S5 } from './aay-p4-s5';
import { PARTI as S6 } from './aay-p4-s6';
import { PARTI as S7 } from './aay-p4-s7';
import { PARTI as S8 } from './aay-p4-s8';

export const PARTI = [...S1, ...S2, ...S3, ...S4, ...S5, ...S6, ...S7, ...S8];
