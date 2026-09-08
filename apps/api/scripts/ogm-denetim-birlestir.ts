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
 *   npx tsx scripts/ogm-denetim-birlestir.ts <parti-adı>
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/37-ogm-inkilap';
type Kayit = {
  id: string; cevap: string; guven: string; dayanak: string;
  gerekce: string; eskime: string | null; uyari: string | null;
};

function main() {
  const parti = process.argv[2] ?? 'ogm-1';
  const yol = (k: string) => `${KOK}/denetim/${parti}-${k}.json`;
  for (const k of ['d1', 'd2']) if (!existsSync(yol(k))) throw new Error(`${yol(k)} yok`);

  const d1: Kayit[] = JSON.parse(readFileSync(yol('d1'), 'utf8'));
  const d2: Kayit[] = JSON.parse(readFileSync(yol('d2'), 'utf8'));
  const anahtar: Record<string, string> = JSON.parse(readFileSync(`${KOK}/anahtar-10.json`, 'utf8'));
  const m1 = new Map(d1.map((x) => [x.id, x]));
  const m2 = new Map(d2.map((x) => [x.id, x]));

  const kararlar = Object.entries(anahtar).map(([no, meb]) => {
    const id = `s${no}`;
    const a = m1.get(id), b = m2.get(id);
    if (!a || !b)
      return { id, karar: 'EKSIK', mebCevabi: meb, d1: a?.cevap ?? null, d2: b?.cevap ?? null, uyarilar: [], dayanak: null, gerekce: null, guven: [] };

    const ikisiAyni = a.cevap === b.cevap;
    const mebUyuyor = ikisiAyni && a.cevap === meb;
    const uyarilar = [a.uyari, b.uyari].filter(Boolean) as string[];
    const dusuk = a.guven === 'dusuk' || b.guven === 'dusuk';

    const karar = mebUyuyor
      ? (uyarilar.length ? 'UYARI' : dusuk ? 'ZAYIF' : 'ONAY')
      : ikisiAyni ? 'ANAHTAR-SUPHELI' : 'CELISKI';

    return {
      id, karar, mebCevabi: meb,
      onerilen: ikisiAyni ? a.cevap : null,
      d1: a.cevap, d2: b.cevap, guven: [a.guven, b.guven],
      dayanak: a.dayanak, dayanak2: b.dayanak,
      gerekce: a.gerekce, gerekce2: b.gerekce,
      uyarilar,
    };
  });

  writeFileSync(`${KOK}/denetim/${parti}-karar.json`, JSON.stringify(kararlar, null, 1));
  const say = (k: string) => kararlar.filter((x) => x.karar === k).length;
  console.log(
    `${parti}: ${kararlar.length} soru → ONAY ${say('ONAY')} · ZAYIF ${say('ZAYIF')} · ` +
    `UYARI ${say('UYARI')} · ANAHTAR-ŞÜPHELİ ${say('ANAHTAR-SUPHELI')} · ÇELİŞKİ ${say('CELISKI')}`,
  );
  for (const k of kararlar) {
    if (k.karar === 'ONAY') continue;
    console.log(`\n  ${k.id} [${k.karar}] meb=${k.mebCevabi} d1=${k.d1} d2=${k.d2} guven=${k.guven.join('/')}`);
    for (const u of k.uyarilar) console.log(`     ⚠ ${u}`);
  }
  console.log(`\n✓ ${KOK}/denetim/${parti}-karar.json`);
}
main();
