/**
 * Doc 37 — iki kör denetçinin sonucunu MEB anahtarıyla karşılaştırır.
 *
 * Doc 34'ten farkı: burada "eskime" ekseni yok (tarih sorusu eskimez), onun
 * yerine **anahtar tartışması** var. MEB'in anahtarı bu partide bir veri, kutsal
 * bir doğru değil: iki bağımsız denetçi kendi aralarında hemfikirse ve anahtarla
 * ayrışıyorsa, şüphe anahtarın üzerindedir.
 *
 *   ONAY           : iki denetçi + anahtar aynı, uyarı yok, güven yüksek
 *   ZAYIF          : aynı, ama en az bir denetçinin güveni düşük
 *   UYARI          : aynı, ama soruda kusur bildirilmiş (tartışmalı ikinci şık,
 *                    kökte hatalı tanım…) → bankaya YAZILMAZ, insana gider
 *   ANAHTAR-SUPHELI: iki denetçi kendi aralarında hemfikir, anahtardan farklı
 *   CELISKI        : denetçiler birbirinden farklı → hakem gerek
 *
 * Anahtar dosyası kimlikle anahtarlanır (`t3s2` gibi): yedi test birleştiği
 * için soru numarası tek başına kimlik değil.
 *
 *   npx tsx scripts/ogm-denetim-birlestir.ts <parti-adı> [anahtar-dosyası]
 *   npx tsx scripts/ogm-denetim-birlestir.ts --hepsi <anahtar-dosyası>
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const KOK = process.env.DOC ?? '/Users/ahmetcnd/Developer/paemisyon/docs/37-ogm-inkilap';
type Kayit = {
  id: string; cevap: string; guven: string; dayanak: string;
  gerekce: string; eskime: string | null; uyari: string | null;
};

function birlestir(parti: string, anahtarYolu: string) {
  const yol = (k: string) => `${KOK}/denetim/${parti}-${k}.json`;
  for (const k of ['d1', 'd2']) if (!existsSync(yol(k))) throw new Error(`${yol(k)} yok`);

  const d1: Kayit[] = JSON.parse(readFileSync(yol('d1'), 'utf8'));
  const d2: Kayit[] = JSON.parse(readFileSync(yol('d2'), 'utf8'));
  // Üçüncü denetçi ZORUNLU DEĞİL. Varsa oybirliği aranır: doğrudan yayına
  // çıkacak partilerde iki kişinin uyuşması yeterli sayılmadı (Doc 38).
  const d3: Kayit[] | null = existsSync(yol('d3')) ? JSON.parse(readFileSync(yol('d3'), 'utf8')) : null;
  const m3 = d3 ? new Map(d3.map((x) => [x.id, x])) : null;
  const tumAnahtar: Record<string, string> = JSON.parse(readFileSync(anahtarYolu, 'utf8'));
  const m1 = new Map(d1.map((x) => [x.id, x]));
  const m2 = new Map(d2.map((x) => [x.id, x]));
  // Yalnız BU partideki sorular — anahtar dosyası partinin tamamını taşıyor.
  const kor: { id: string }[] = JSON.parse(readFileSync(`${KOK}/parti/${parti}-kor.json`, 'utf8'));

  const kararlar = kor.map(({ id }) => {
    const meb = tumAnahtar[id];
    if (!meb) throw new Error(`${id}: anahtarda yok`);
    const a = m1.get(id), b = m2.get(id);
    if (!a || !b)
      return { id, karar: 'EKSIK', mebCevabi: meb, d1: a?.cevap ?? null, d2: b?.cevap ?? null, uyarilar: [], dayanak: null, gerekce: null, guven: [] };

    const c = m3?.get(id) ?? null;
    if (m3 && !c) return { id, karar: 'EKSIK', mebCevabi: meb, d1: a.cevap, d2: b.cevap, d3: null, onerilen: null, guven: [], dayanak: null, dayanak2: null, gerekce: null, gerekce2: null, uyarilar: [] };
    const cevaplar = [a.cevap, b.cevap, ...(c ? [c.cevap] : [])];
    const ikisiAyni = new Set(cevaplar).size === 1;
    const mebUyuyor = ikisiAyni && a.cevap === meb;
    const uyarilar = [a.uyari, b.uyari, c?.uyari].filter(Boolean) as string[];
    const dusuk = [a.guven, b.guven, ...(c ? [c.guven] : [])].includes('dusuk');

    const karar = mebUyuyor
      ? (uyarilar.length ? 'UYARI' : dusuk ? 'ZAYIF' : 'ONAY')
      : ikisiAyni ? 'ANAHTAR-SUPHELI' : 'CELISKI';

    return {
      id, karar, mebCevabi: meb,
      onerilen: ikisiAyni ? a.cevap : null,
      d1: a.cevap, d2: b.cevap, d3: c?.cevap ?? null,
      guven: [a.guven, b.guven, ...(c ? [c.guven] : [])],
      dayanak: a.dayanak, dayanak2: b.dayanak,
      gerekce: a.gerekce, gerekce2: b.gerekce, gerekce3: c?.gerekce ?? null,
      uyarilar,
    };
  });

  writeFileSync(`${KOK}/denetim/${parti}-karar.json`, JSON.stringify(kararlar, null, 1));
  return kararlar;
}

function main() {
  const arg = process.argv[2] ?? 'ogm-1';
  const anahtarYolu = process.argv[3] ?? `${KOK}/anahtar-10.json`;
  const partiler = arg === '--hepsi'
    ? readdirSync(`${KOK}/denetim`).map((f) => /^(.+)-d1\.json$/.exec(f)?.[1]).filter(Boolean).sort() as string[]
    : [arg];

  const toplam: Record<string, number> = {};
  for (const parti of partiler) {
    const kararlar = birlestir(parti, anahtarYolu);
    const say = (k: string) => kararlar.filter((x) => x.karar === k).length;
    for (const k of ['ONAY', 'ZAYIF', 'UYARI', 'ANAHTAR-SUPHELI', 'CELISKI', 'EKSIK'])
      toplam[k] = (toplam[k] ?? 0) + say(k);
    console.log(
      `${parti}: ${kararlar.length} soru → ONAY ${say('ONAY')} · ZAYIF ${say('ZAYIF')} · ` +
      `UYARI ${say('UYARI')} · ANAHTAR-ŞÜPHELİ ${say('ANAHTAR-SUPHELI')} · ÇELİŞKİ ${say('CELISKI')}`,
    );
    for (const k of kararlar) {
      if (k.karar === 'ONAY') continue;
      console.log(`\n  ${k.id} [${k.karar}] meb=${k.mebCevabi} d1=${k.d1} d2=${k.d2}${(k as any).d3 ? ` d3=${(k as any).d3}` : ''} guven=${k.guven.join('/')}`);
      for (const u of k.uyarilar) console.log(`     ⚠ ${u}`);
    }
    console.log('');
  }
  if (partiler.length > 1)
    console.log(`TOPLAM ${Object.values(toplam).reduce((a, b) => a + b, 0)} → ` +
      Object.entries(toplam).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · '));
}
main();
