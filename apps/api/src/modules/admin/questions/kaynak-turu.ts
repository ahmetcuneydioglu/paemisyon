/**
 * Kaynak türü — sorunun `sourceLabel` etiketinden türetilen editoryal sınıf
 * (Doc 49 A0, 16 Eki 2026). Soru bankasının varlık nedeni "gerçek, kaynaklı
 * çıkmış soru" güvenidir; sentetik sorular (AI üretimi, mevzuat türetimi)
 * CLAUDE.md istisnalarıyla üretilir ve YAYIN KARARI İNSANINDIR. Onay kuyruğu
 * bu türleri birbirinden ayırt edebilmeli; toplu onay sentetik soruya kapalıdır.
 *
 * Etiket biçimleri kaynak hat betiklerinden gelir:
 *   - "AI üretimi — …"            (Doc 43 AAY, Doc 35 güncel, matematik)
 *   - "Mevzuat türetimi — <kanun> md <no>"  (Doc 39)
 * Tek karar noktası burasıdır; istemciler bu sınıfı sunucudan alır.
 */
export type KaynakTuru = 'gercek' | 'turetim' | 'ai' | 'yok';

export const KAYNAK_TURLERI: readonly KaynakTuru[] = ['gercek', 'turetim', 'ai', 'yok'];

// Karşılaştırma için sadeleştirme: küçük harf + NFD + noktalı büyük İ'nin
// bıraktığı birleşik nokta (U+0307) atılır. tr-TR küçültme KULLANILMAZ: "AI"
// o yerelde "aı" olur ve ön ek eşleşmez.
function sade(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0307/g, '');
}
const ONEK_AI = sade('ai üretimi');
const ONEK_TURETIM = sade('mevzuat türetimi');

export function kaynakTuru(sourceLabel: string | null | undefined): KaynakTuru {
  const s = (sourceLabel ?? '').trim();
  if (!s) return 'yok';
  const k = sade(s);
  if (k.startsWith(ONEK_AI)) return 'ai';
  if (k.startsWith(ONEK_TURETIM)) return 'turetim';
  return 'gercek';
}

/** Sentetik (insan incelemesi zorunlu, toplu onay yasak) mı? */
export function sentetikMi(sourceLabel: string | null | undefined): boolean {
  const t = kaynakTuru(sourceLabel);
  return t === 'ai' || t === 'turetim';
}

export function kaynakTuruMu(v: unknown): v is KaynakTuru {
  return typeof v === 'string' && (KAYNAK_TURLERI as readonly string[]).includes(v);
}
