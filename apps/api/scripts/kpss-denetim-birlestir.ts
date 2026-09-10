/**
 * Doc 42 — iki kör denetçinin sonucunu ÖSYM anahtarıyla karşılaştırır.
 *
 * `ogm-denetim-birlestir.ts`'in Doc 42 uyarlaması. Tek yapısal farkı: eskime
 * ekseni denetçi çıktısında İKİ AYRI ALAN olarak toplanıyor —
 *   `eskime`         : değişiklik doğru CEVABI değiştiriyor  → ESKIMIS
 *   `guncellenecek`  : cevap aynı ama METİN bugüne uymuyor   → GUNCELLENECEK
 * Doc 40'ta bu ayrım tek alandan türetiliyordu ve denetçinin hangisini
 * kastettiği kaybolabiliyordu; burada denetçi kendisi söylüyor.
 *
 *   ONAY           : iki denetçi + anahtar aynı, uyarı yok, güven yüksek
 *   ZAYIF          : aynı, ama en az bir denetçinin güveni düşük
 *   UYARI          : aynı, ama soruda kusur bildirilmiş → bankaya YAZILMAZ
 *   GUNCELLENECEK  : cevap doğru, metin bugüne göre düzeltilmeli
 *   ESKIMIS        : mevzuat değişikliği anahtarı geçersiz kılmış
 *   ANAHTAR-SUPHELI: iki denetçi hemfikir, anahtardan farklı, eskime yok
 *   CELISKI        : denetçiler birbirinden farklı → hakem gerek
 *
 *   DOC=<dizin> npx tsx scripts/kpss-denetim-birlestir.ts --hepsi <anahtar.json>
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const KOK = process.env.DOC ?? '/Users/ahmetcnd/Developer/paemisyon/docs/42-kpss-kamu-yonetimi';
type Kayit = {
  id: string; cevap: string; guven: string; dayanak: string; gerekce: string;
  eskime: string | null; guncellenecek?: string | null; uyari: string | null;
};

function birlestir(parti: string, anahtarYolu: string) {
  const yol = (k: string) => `${KOK}/denetim/${parti}-${k}.json`;
  for (const k of ['d1', 'd2']) if (!existsSync(yol(k))) throw new Error(`${yol(k)} yok`);

  const d1: Kayit[] = JSON.parse(readFileSync(yol('d1'), 'utf8'));
  const d2: Kayit[] = JSON.parse(readFileSync(yol('d2'), 'utf8'));
  const d3: Kayit[] | null = existsSync(yol('d3')) ? JSON.parse(readFileSync(yol('d3'), 'utf8')) : null;
  const m1 = new Map(d1.map((x) => [x.id, x]));
  const m2 = new Map(d2.map((x) => [x.id, x]));
  const m3 = d3 ? new Map(d3.map((x) => [x.id, x])) : null;
  const tumAnahtar: Record<string, string> = JSON.parse(readFileSync(anahtarYolu, 'utf8'));
  const kor: { id: string }[] = JSON.parse(readFileSync(`${KOK}/parti/${parti}-kor.json`, 'utf8'));

  const kararlar = kor.map(({ id }) => {
    const osym = tumAnahtar[id];
    if (!osym) throw new Error(`${id}: anahtarda yok`);
    const a = m1.get(id), b = m2.get(id), c = m3?.get(id) ?? null;
    if (!a || !b || (m3 && !c))
      return { id, karar: 'EKSIK', osymCevabi: osym, onerilen: null, d1: a?.cevap ?? null, d2: b?.cevap ?? null,
        d3: c?.cevap ?? null, guven: [] as string[], dayanak: null, dayanak2: null, gerekce: null, gerekce2: null,
        gerekce3: null, uyarilar: [] as string[], eskimeler: [] as string[], guncellemeler: [] as string[] };

    const cevaplar = [a.cevap, b.cevap, ...(c ? [c.cevap] : [])];
    const hepsiAyni = new Set(cevaplar).size === 1;
    const anahtarUyuyor = hepsiAyni && a.cevap === osym;
    const uyarilar = [a.uyari, b.uyari, c?.uyari].filter(Boolean) as string[];
    const eskimeler = [a.eskime, b.eskime, c?.eskime].filter(Boolean) as string[];
    const guncellemeler = [a.guncellenecek, b.guncellenecek, c?.guncellenecek].filter(Boolean) as string[];
    const dusuk = [a.guven, b.guven, ...(c ? [c.guven] : [])].includes('dusuk');

    const karar = anahtarUyuyor
      ? (uyarilar.length ? 'UYARI'
        : (guncellemeler.length || eskimeler.length) ? 'GUNCELLENECEK'
        : dusuk ? 'ZAYIF' : 'ONAY')
      : hepsiAyni
        ? (eskimeler.length ? 'ESKIMIS' : 'ANAHTAR-SUPHELI')
        : 'CELISKI';

    return {
      id, karar, osymCevabi: osym, onerilen: hepsiAyni ? a.cevap : null,
      d1: a.cevap, d2: b.cevap, d3: c?.cevap ?? null,
      guven: [a.guven, b.guven, ...(c ? [c.guven] : [])],
      dayanak: a.dayanak, dayanak2: b.dayanak,
      gerekce: a.gerekce, gerekce2: b.gerekce, gerekce3: c?.gerekce ?? null,
      uyarilar, eskimeler, guncellemeler,
    };
  });

  writeFileSync(`${KOK}/denetim/${parti}-karar.json`, JSON.stringify(kararlar, null, 1));
  return kararlar;
}

function main() {
  const arg = process.argv[2] ?? '--hepsi';
  const anahtarYolu = process.argv[3] ?? `${KOK}/anahtar-22.json`;
  const partiler = arg === '--hepsi'
    ? (readdirSync(`${KOK}/denetim`).map((f) => /^(.+)-d1\.json$/.exec(f)?.[1]).filter(Boolean) as string[]).sort()
    : [arg];

  const toplam: Record<string, number> = {};
  for (const parti of partiler) {
    const kararlar = birlestir(parti, anahtarYolu);
    const say = (k: string) => kararlar.filter((x) => x.karar === k).length;
    for (const k of ['ONAY', 'ZAYIF', 'UYARI', 'GUNCELLENECEK', 'ESKIMIS', 'ANAHTAR-SUPHELI', 'CELISKI', 'EKSIK'])
      toplam[k] = (toplam[k] ?? 0) + say(k);
    console.log(
      `${parti}: ${kararlar.length} soru → ONAY ${say('ONAY')} · ZAYIF ${say('ZAYIF')} · ` +
      `UYARI ${say('UYARI')} · GÜNCELLENECEK ${say('GUNCELLENECEK')} · ESKİMİŞ ${say('ESKIMIS')} · ` +
      `ANAHTAR-ŞÜPHELİ ${say('ANAHTAR-SUPHELI')} · ÇELİŞKİ ${say('CELISKI')}`,
    );
    for (const k of kararlar) {
      if (k.karar === 'ONAY') continue;
      console.log(`\n  ${k.id} [${k.karar}] ösym=${k.osymCevabi} d1=${k.d1} d2=${k.d2}${k.d3 ? ` d3=${k.d3}` : ''} guven=${k.guven.join('/')}`);
      for (const u of k.uyarilar) console.log(`     ⚠ ${u}`);
      for (const e of k.eskimeler) console.log(`     ⏳ ESKİME: ${e}`);
      for (const g of k.guncellemeler) console.log(`     ✎ GÜNCELLENECEK: ${g}`);
    }
    console.log('');
  }
  console.log(`TOPLAM ${Object.values(toplam).reduce((a, b) => a + b, 0)} → ` +
    Object.entries(toplam).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · '));
}
main();
