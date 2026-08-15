/**
 * Kaynak etiketlerini kısa kanonik biçime çevirir (rozet taşmasın):
 * "TARİHİNDE YAPILAN" kalıbı atılır, kurumlar kısaltılır (EGM, JGK, MEB,
 * GYS, ÇMB), ara daire/başkanlık adları çıkarılır. Aynı sınavın farklı
 * yazımları tek etikette birleşir. APPLY=1 ile yazar.
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Birebir eşleme — 24 mevcut etiket gözden geçirilerek elle kuruldu.
// Yeni içe aktarımlar için genel kurallar (aşağıda) yine çalışır.
const MAP = new Map<string, string>([
  ['26 TEMMUZ 2020 TARİHİNDE YAPILAN MİSYON KORUMA SINAVI', '26 TEMMUZ 2020 MİSYON KORUMA SINAVI'],
  ['16 NİSAN 2023 TARİHİNDE YAPILAN EGM MİSYON KORUMA SINAVI', '16 NİSAN 2023 EGM MİSYON KORUMA SINAVI'],
  ['İÇİŞLERİ BAKANLIĞI GÖREVDE YÜKSELME SINAVI', 'İÇİŞLERİ BAKANLIĞI GYS'],
  ['30 EYLÜL 2023 JANDARMA GENEL KOMUTANLIĞI DIŞ MİSYON KORUMA SINAVI', '30 EYLÜL 2023 JGK DIŞ MİSYON KORUMA SINAVI'],
  [
    '30 EYLÜL 2023 TARİHİNDE YAPILAN JANDARMA GENEL KOMUTANLIĞI STRATEJİ VE DIŞ İLİŞKİLER BAŞKANLIĞI DIŞ MİSYON KORUMA PERSONEL SEÇME YAZILI SINAVI',
    '30 EYLÜL 2023 JGK DIŞ MİSYON KORUMA SINAVI',
  ],
  ['19 AĞUSTOS 2023 ADALET BAKANLIĞI GÖREVDE YÜKSELME SINAVI', '19 AĞUSTOS 2023 ADALET BAKANLIĞI GYS'],
  ['19 AĞUSTOS 2023 ADALET BAKANLIĞI GYS SINAVI', '19 AĞUSTOS 2023 ADALET BAKANLIĞI GYS'],
  [
    '02 NİSAN 2023 MEB YURT DIŞINDA GÖREVLENDİRİLECEK OKUTMAN VE ÖĞRETMENLER',
    '02 NİSAN 2023 MEB YURT DIŞI OKUTMAN-ÖĞRETMEN SINAVI',
  ],
  ['2023 / 1. DÖNEM ÇARŞI VE MAHALLE BEKÇİLİĞİ YAZILI SINAVI', '2023/1 ÇMB YAZILI SINAVI'],
  ['09 TEMMUZ 2023 MEB GÖREVDE YÜKSELME SINAVI', '09 TEMMUZ 2023 MEB GYS'],
  ['09 TEMMUZ 2023 M.E.B GÖREVDE YÜKSELME SINAVI', '09 TEMMUZ 2023 MEB GYS'],
  [
    '13 ŞUBAT 2021 TARİHİNDE YAPILAN MEB YÜKSEKÖĞRETİM VE YURT DIŞI EĞİTİM GENEL MÜDÜRLÜĞÜ YURT DIŞINDA GÖREVLENDİRİLECEK OKUTMAN VE ÖĞRETMENLERİN',
    '13 ŞUBAT 2021 MEB YURT DIŞI OKUTMAN-ÖĞRETMEN SINAVI',
  ],
  [
    '17 TEMMUZ 2022 TARİHİNDE YAPILAN EMNİYET GENEL MÜDÜRLÜĞÜ POLİS AKADEMİSİ BAŞKANLIĞI 2022 / 1. DÖNEM ÇARŞI VE MAHALLE BEKÇİLİĞİ YAZILI SINAVI',
    '17 TEMMUZ 2022 EGM 2022/1 ÇMB YAZILI SINAVI',
  ],
  [
    '30 KASIM 2025 TARİHİNDE YAPILAN ADALET BAKANLIĞI PERSONEL GENEL MÜDÜRLÜĞÜ GÖREVDE YÜKSELME SINAVI',
    '30 KASIM 2025 ADALET BAKANLIĞI GYS',
  ],
  ['30 KASIM 2025 ADALET BAKANLIĞI GÖREVDE YÜKSELME SINAVI', '30 KASIM 2025 ADALET BAKANLIĞI GYS'],
  [
    '01 ARALIK 2024 EMLAK/MÎLLİ EMLAK MÜDÜR VE MÜDÜR YARDIMCILIĞI GÖREVDE YÜKSELME e-SINAVI',
    '01 ARALIK 2024 MİLLİ EMLAK MÜDÜRLÜĞÜ GYS',
  ],
  [
    '08 ARALIK 2024 TARİHİNDE YAPILAN ADALET BAKANLIĞI İCRA İŞLERİ DAİRESİ BAŞKANLIĞI GÖREVDE YÜKSELME SURETİYLE İCRA MÜDÜR VE MÜDÜR YARDIMCILARINI SEÇME SINAVI',
    '08 ARALIK 2024 ADALET BAKANLIĞI İCRA MÜDÜRLÜĞÜ GYS',
  ],
  [
    '5 EYLÜL 2021 TARİHİNDE YAPILAN MİLLÎ EĞİTİM BAKANLIĞI ÖĞRETMEN YETİŞTİRME VE GELİŞTİRME GENEL MÜDÜRLÜĞÜ ADAYLIK KALDIRMA SINAVI',
    '5 EYLÜL 2021 MEB ADAYLIK KALDIRMA SINAVI',
  ],
  [
    '20 ARALIK 2025 TARİHİNDE YAPILAN AÇIK ÖĞRETİM ORTAOKULU 2025-2026 ÖĞRETİM YILI',
    '20 ARALIK 2025 AÇIK ÖĞRETİM ORTAOKULU SINAVI',
  ],
]);

/** Eşlemede olmayan (gelecekteki) etiketler için genel kısaltma kuralları. */
function genelKisalt(t: string): string {
  return t
    .replace(/\s*TARİHİNDE YAPILAN\s*/g, ' ')
    .replace(/EMNİYET GENEL MÜDÜRLÜĞÜ/g, 'EGM')
    .replace(/JANDARMA GENEL KOMUTANLIĞI/g, 'JGK')
    .replace(/MİLLÎ? EĞİTİM BAKANLIĞI/g, 'MEB')
    .replace(/\bM\.E\.B\b/g, 'MEB')
    .replace(/ÇARŞI VE MAHALLE BEKÇİLİĞİ/g, 'ÇMB')
    .replace(/GÖREVDE YÜKSELME SINAVI/g, 'GYS')
    .replace(/GYS SINAVI/g, 'GYS')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

(async () => {
  const apply = process.env.APPLY === '1';
  const rows = await p.$queryRawUnsafe<{ label: string; c: bigint }[]>(`
    SELECT qv.source_label AS label, COUNT(*) c FROM question_versions qv
    JOIN questions q ON q.id = qv.question_id
    WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
      AND qv.source_label IS NOT NULL AND qv.source_label <> ''
    GROUP BY qv.source_label`);
  let changed = 0;
  for (const r of rows) {
    const yeni = MAP.get(r.label) ?? genelKisalt(r.label);
    if (yeni === r.label) continue;
    changed += Number(r.c);
    console.log(`${r.c}× "${r.label.slice(0, 70)}"\n   → "${yeni}" (${yeni.length})`);
    if (apply) {
      await p.$executeRawUnsafe(
        `UPDATE question_versions SET source_label = $1 WHERE source_label = $2`,
        yeni,
        r.label,
      );
    }
  }
  console.log(`\n${apply ? 'uygulandı' : 'değişecek'}: ${changed} sürüm`);
  await p.$disconnect();
})();
