/**
 * Doc 35 — bozulan karar dosyalarını onarır (tek seferlik).
 *
 * HATA: ilk beş alanın şıkları dengelendikten SONRA birleştirici yeniden
 * çalıştırıldı. Denetçiler soruları dengeleme öncesi görmüştü; onların harfleri
 * dengeleme sonrası anahtarla karşılaştırılınca 48 soru sahte CELISKI oldu.
 * Bankaya yazılmış sorular etkilenmedi, bozulan yalnız denetim arşividir.
 *
 * ONARIM: özgün kararlar kurtarma partilerinden geri türetilir.
 *  - kurtarma/parca-1.json + parca-2.json = özgün birleştirmenin UYARI kümesi
 *    (27 soru); bu dosyalarda dengeleme ÖNCESİ şıklar da duruyor.
 *  - Bu kümede olmayan her soru özgün birleştirmede ONAY'dı (43 soru).
 *  - 27 UYARI sorusunun tamamında iki denetçi de anahtarla aynı şıkkı işaretledi
 *    (parca dosyalarındaki denetciler[].cevap ile doğrulandı), dolayısıyla
 *    d1/d2 dengeleme sonrası anahtara eşitlenir. Eşleme metin üzerinden
 *    doğrulanır: denetçinin işaretlediği şıkkın metni, bugünkü doğru şıkkın
 *    metnine eşit olmalı (yalnız kurtarmada düzeltilen imla farkına izin var).
 *
 * Denetçi kaynakları, gerekçeler, uyarılar ve meta alanları harften bağımsız
 * üretildiği için dokunulmaz.
 *
 *   npx tsx scripts/guncel-karar-onar.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/guncel-karar-onar.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';
const APPLY = process.env.APPLY === '1';
/** Dengeleme sonrası birleştiricinin bozduğu alanlar. */
const ALANLAR = [
  'ekonomi-teknoloji-savunma', 'kultur-sanat-bilim', 'spor',
  'turkiye-siyaset-mevzuat', 'uluslararasi',
];

/** Aksan/imla farkını yok sayan karşılaştırma (kurtarma turu imla düzeltti). */
const sadelestir = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr');

function main() {
  const uyariKumesi = new Map<string, any>();
  for (const f of ['parca-1.json', 'parca-2.json']) {
    const o = JSON.parse(readFileSync(`${KOK}/kurtarma/${f}`, 'utf8'));
    for (const s of o.sorular) uyariKumesi.set(s.id, s);
  }

  let onarilan = 0;
  for (const alan of ALANLAR) {
    const sorular = JSON.parse(readFileSync(`${KOK}/arastirma/${alan}.json`, 'utf8')).sorular;
    const yol = `${KOK}/denetim/${alan}-karar.json`;
    const kararlar = JSON.parse(readFileSync(yol, 'utf8'));

    for (const k of kararlar) {
      const sira = Number(k.id.slice(k.id.lastIndexOf('-') + 1)) - 1;
      const soru = sorular[sira];
      if (!soru) throw new Error(`${k.id} araştırma dosyasında yok`);
      const anahtar = soru.dogru;
      if (k.uretilenCevap !== anahtar) throw new Error(`${k.id} anahtarı sapmış: ${k.uretilenCevap} != ${anahtar}`);

      const parca = uyariKumesi.get(k.id);
      const beklenen = parca ? 'UYARI' : 'ONAY';
      // Onarılmış kayıt: harfler zaten dengeleme sonrası, tekrar dokunulmaz.
      if (k.karar === beklenen && k.d1 === anahtar && k.d2 === anahtar) continue;
      if (k.karar !== 'CELISKI') throw new Error(`${k.id} beklenmedik karar: ${k.karar}`);
      if (parca) {
        // Denetçinin dengeleme öncesi işaretlediği metin, bugünkü doğru şık olmalı.
        const isaretlenen = parca.siklar[k.d1];
        if (!isaretlenen || sadelestir(isaretlenen) !== sadelestir(soru.siklar[anahtar]))
          throw new Error(`${k.id} eşleme doğrulanamadı: "${isaretlenen}" != "${soru.siklar[anahtar]}"`);
      }
      if (k.d1 !== k.d2) throw new Error(`${k.id} denetçiler ayrışmış: ${k.d1}/${k.d2}`);
      console.log(`  ${k.id}  ${k.karar} → ${beklenen}   d ${k.d1}/${k.d2} → ${anahtar}`);
      k.karar = beklenen;
      k.d1 = anahtar;
      k.d2 = anahtar;
      onarilan++;
    }
    if (APPLY) writeFileSync(yol, JSON.stringify(kararlar, null, 1));
  }

  console.log(`\nonarılan kayıt: ${onarilan}`);
  if (!APPLY) console.log('(kuru çalışma — APPLY=1 ile yazılır)');
}
main();
