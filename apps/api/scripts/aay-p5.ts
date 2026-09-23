/**
 * Analitik Akıl Yürütme · 5. parti — 7 senaryo × 3 soru (Doc 43, 23 Eyl 2026).
 *
 * Her senaryo kendi modülünde (aay-p5-s1 … aay-p5-s7); bu dosya onları partinin
 * sırasıyla toplar. Hedef, bankada karşılığı olmayan PAEM 10 soru ailesi
 * (çok nitelikli gruplama + sayım kısıtı) ile Roma rakamlı ve yeterlilik
 * biçimleriydi. Her senaryo üç kapıdan geçti: çözücü kanıtı (aay-cozucu),
 * yalnız Türkçe metni görerek bütün durumları sayan kör çözücü ve kod↔metin
 * denetçisi (belirsiz cümleler öbür okumalarıyla yeniden koşuldu).
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5
 *   npx tsx scripts/aay-bankaya-yaz.ts aay-p5          (kuru)
 */
import { PARTI as S1 } from './aay-p5-s1';
import { PARTI as S2 } from './aay-p5-s2';
import { PARTI as S3 } from './aay-p5-s3';
import { PARTI as S4 } from './aay-p5-s4';
import { PARTI as S5 } from './aay-p5-s5';
import { PARTI as S6 } from './aay-p5-s6';
import { PARTI as S7 } from './aay-p5-s7';

export const PARTI = [...S1, ...S2, ...S3, ...S4, ...S5, ...S6, ...S7];
