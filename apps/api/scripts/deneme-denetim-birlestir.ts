/**
 * Doc 34 — iki kör denetçinin sonucunu cevap anahtarıyla karşılaştırır.
 *
 * Doc 33'ten farkı: sorular 2022 tarihli, denetçiler 2026 metnine baktı.
 * Bu yüzden "denetçiler kitapla ayrıştı" tek anlama gelmiyor:
 *
 *   ESKIMIS  : iki denetçi kendi aralarında hemfikir, kitaptan farklı ve
 *              en az biri ayrışmayı MEVZUAT DEĞİŞİKLİĞİYLE açıklıyor
 *              → kusur değil, GÜNCELLEME işi (anahtar 2026'ya çekilir)
 *   CELISKI  : ayrışma var ama açıklama yok → anahtar şüpheli, hakem gerek
 *   UYARI    : cevap tutuyor ama soruda kusur bildirilmiş
 *   ZAYIF    : cevap tutuyor, güven düşük
 *   ONAY     : temiz
 *
 *   npx tsx scripts/deneme-denetim-birlestir.ts [--hepsi | <parti-adı>]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';
/** Hakem turu kararları — iki hakem MUTABIKSA bağlayıcı. */
const HAKEM: Record<string, { karar: string; cevap: string | null; gerekce: string; alinti: string }> =
  existsSync(`${KOK}/denetim/hakem-kararlari.json`)
    ? JSON.parse(readFileSync(`${KOK}/denetim/hakem-kararlari.json`, 'utf8')) : {};
type Kayit = { id: string; cevap: string; guven: string; dayanak: string; gerekce: string; eskime: string | null; uyari: string | null };

function birlestir(parti: string) {
  const y1 = `${KOK}/denetim/${parti}-d1.json`, y2 = `${KOK}/denetim/${parti}-d2.json`;
  if (!existsSync(y1) || !existsSync(y2)) return null;
  const d1: Kayit[] = JSON.parse(readFileSync(y1, 'utf8'));
  const d2: Kayit[] = JSON.parse(readFileSync(y2, 'utf8'));
  const anahtar: Record<string, string> = JSON.parse(readFileSync(`${KOK}/parti/${parti}-anahtar.json`, 'utf8'));
  const m1 = new Map(d1.map((x) => [x.id, x])), m2 = new Map(d2.map((x) => [x.id, x]));

  const kararlar = Object.entries(anahtar).map(([id, kitap]) => {
    const a = m1.get(id), b = m2.get(id);
    if (!a || !b) return { id, karar: 'EKSIK', kitapCevabi: kitap, d1: a?.cevap ?? null, d2: b?.cevap ?? null, eskimeler: [], uyarilar: [], dayanak: null, gerekce: null };
    const ikisiAyni = a.cevap === b.cevap;
    const kitapUyuyor = ikisiAyni && a.cevap === kitap;
    const eskimeler = [a.eskime, b.eskime].filter(Boolean) as string[];
    const uyarilar = [a.uyari, b.uyari].filter(Boolean) as string[];
    const dusuk = a.guven === 'dusuk' || b.guven === 'dusuk';

    let karar: string;
    if (kitapUyuyor) karar = uyarilar.length ? 'UYARI' : dusuk ? 'ZAYIF' : 'ONAY';
    else if (ikisiAyni && eskimeler.length) karar = 'ESKIMIS';
    else karar = 'CELISKI';

    // Hakem turu çelişkiyi bağlayıcı biçimde çözer.
    const h = HAKEM[id];
    if (h && karar === 'CELISKI') {
      karar = h.karar === 'kitap' ? (uyarilar.length ? 'UYARI' : 'ONAY')
        : h.karar === 'denetci' ? 'ANAHTAR-HATALI'
        : h.karar === 'eskimis' ? 'ESKIMIS' : 'KUSURLU';
      if (h.karar !== 'kitap') uyarilar.push(`HAKEM: ${h.gerekce}`);
    }

    return { id, karar, kitapCevabi: kitap,
             guncelCevap: HAKEM[id]?.cevap ?? (ikisiAyni ? a.cevap : null),
             hakemAlintisi: HAKEM[id]?.alinti ?? null,
             d1: a.cevap, d2: b.cevap, guven: [a.guven, b.guven],
             dayanak: a.dayanak, gerekce: a.gerekce, eskimeler, uyarilar };
  });
  writeFileSync(`${KOK}/denetim/${parti}-karar.json`, JSON.stringify(kararlar, null, 1));
  return kararlar;
}

function main() {
  const arg = process.argv[2] ?? '--hepsi';
  const partiler = arg === '--hepsi'
    ? [...new Set(readdirSync(`${KOK}/denetim`).map((f) => /^(.+)-d1\.json$/.exec(f)?.[1]).filter(Boolean) as string[])].sort()
    : [arg];
  const T: Record<string, number> = {};
  const eskimisler: any[] = [];
  for (const parti of partiler) {
    const r = birlestir(parti);
    if (!r) { console.log(`${parti}: denetim dosyaları eksik`); continue; }
    const say = (k: string) => r.filter((x) => x.karar === k).length;
    for (const k of ['ONAY', 'ZAYIF', 'UYARI', 'ESKIMIS', 'CELISKI', 'ANAHTAR-HATALI', 'KUSURLU', 'EKSIK']) T[k] = (T[k] ?? 0) + say(k);
    console.log(`${parti.padEnd(26)} ${String(r.length).padStart(3)} → ONAY ${say('ONAY')} · ZAYIF ${say('ZAYIF')} · UYARI ${say('UYARI')} · ESKİMİŞ ${say('ESKIMIS')} · ÇELİŞKİ ${say('CELISKI')}`);
    eskimisler.push(...r.filter((x) => x.karar === 'ESKIMIS'));
  }
  console.log(`\nTOPLAM ${Object.values(T).reduce((a, b) => a + b, 0)} → ${Object.entries(T).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  if (eskimisler.length) {
    console.log(`\n═══ MEVZUAT DEĞİŞMİŞ (${eskimisler.length}) ═══`);
    for (const e of eskimisler) {
      console.log(`\n  ${e.id}: kitap=${e.kitapCevabi} → güncel=${e.guncelCevap}`);
      console.log(`     ${e.eskimeler[0]?.slice(0, 160)}`);
    }
  }
}
main();
