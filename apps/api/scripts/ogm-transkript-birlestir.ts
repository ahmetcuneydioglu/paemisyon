/**
 * Doc 37 — iki bağımsız transkripti tek kanonik metne indirir.
 *
 * Ajanlar sayfayı doğru okudu ama aynı şeyi farklı biçimde yazdı: biri şıkların
 * tablo düzenini parantez içinde anlattı, diğeri anlatmadı; biri sütun
 * başlıklarını şıkkın içine koydu, diğeri koymadı. Bunlar OKUMA farkı değil,
 * BİÇİM farkı — talimatın eksiğiydi, sorunun değil.
 *
 * Bu yüzden birleştirme iki adımda:
 *   1. Ajanların kendi ekledikleri parantez içi düzen notları kökten sökülür
 *      (kaynak metinde yoklar; ajanın yorumu).
 *   2. Kalan metin İKİSİNDE DE aynı olmalı. Değilse soru `--karar` dosyasıyla
 *      elle çözülür; kendiliğinden bir taraf seçilmez.
 *
 * Kaynağı görsele dayanan sorular (`gorselGerekli`) ayrıca işaretlenir; onların
 * görselleri `ogm-gorsel-cikar.ts` ile çıkarılıp `mediaUrl` olarak taşınır.
 *
 *   npx tsx scripts/ogm-transkript-birlestir.ts <doc> <anahtar-dizini> <t16 t17 …>
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;

/** Ajanın eklediği düzen/görsel açıklaması — kaynak metinde yok. */
const NOT_KALIBI =
  /\((?:Şıklar|Soru kökünün|Kökte|Not:|Tabloda|Haritada|Görselde|Bu soruda)[^)]*\)/gu;

const temizle = (t: string) =>
  (t ?? '').replace(NOT_KALIBI, '').replace(/\n{3,}/g, '\n\n').trim();

const normalize = (t: string) =>
  (t ?? '')
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function main() {
  const [doc, anahtarDizin, ...testler] = process.argv.slice(2);
  if (!doc || !anahtarDizin || !testler.length)
    throw new Error('kullanım: ogm-transkript-birlestir.ts <doc> <anahtar-dizini> <t16 t17 …>');

  // Elle çözülmüş biçim farkları: id → hangi transkript kanonik ('a' | 'b').
  const kararYolu = `${doc}/transkript/karar.json`;
  const karar: Record<string, 'a' | 'b'> = existsSync(kararYolu)
    ? JSON.parse(readFileSync(kararYolu, 'utf8')) : {};

  const cikti: any[] = [];
  const cozulmemis: string[] = [];
  let gorselli = 0;

  for (const t of testler) {
    const A = JSON.parse(readFileSync(`${doc}/transkript/${t}-a.json`, 'utf8'));
    const B = new Map<string, any>(
      JSON.parse(readFileSync(`${doc}/transkript/${t}-b.json`, 'utf8')).map((q: any) => [q.id, q]),
    );
    const anahtar: Record<string, string> = JSON.parse(
      readFileSync(`${anahtarDizin}/${t}/anahtar-kismi.json`, 'utf8'),
    );

    for (const a of A) {
      const b = B.get(a.id);
      if (!b) { cozulmemis.push(`${a.id}: ikinci transkriptte yok`); continue; }
      if (a.okunamadi || b.okunamadi) { cozulmemis.push(`${a.id}: okunamadi işaretli`); continue; }

      const aKok = temizle(a.kok), bKok = temizle(b.kok);
      const ayri = [
        normalize(aKok) !== normalize(bKok) ? 'kok' : null,
        ...SIKLAR.map((l) => (normalize(a.siklar?.[l]) !== normalize(b.siklar?.[l]) ? `şık ${l}` : null)),
      ].filter(Boolean);

      let secilen = a;
      if (ayri.length) {
        const k = karar[a.id];
        if (!k) { cozulmemis.push(`${a.id}: ${ayri.join(', ')} — karar.json'da yok`); continue; }
        secilen = k === 'a' ? a : b;
      }

      const no = /s(\d+)$/.exec(a.id)?.[1];
      const dogru = anahtar[no ?? ''];
      if (!dogru) { cozulmemis.push(`${a.id}: cevap anahtarı yok`); continue; }

      const eksik = SIKLAR.filter((l) => !secilen.siklar?.[l]);
      if (eksik.length) { cozulmemis.push(`${a.id}: şık eksik (${eksik.join(', ')})`); continue; }

      const gorselGerekli = !!(a.gorselGerekli || b.gorselGerekli);
      if (gorselGerekli) gorselli++;
      cikti.push({
        id: a.id, test: t, no: Number(no), kok: temizle(secilen.kok),
        siklar: Object.fromEntries(SIKLAR.map((l) => [l, secilen.siklar[l]])),
        dogru, gorselGerekli,
      });
    }
  }

  console.log(`birleşen soru : ${cikti.length}`);
  console.log(`görsel gerekli: ${gorselli}  (${cikti.filter((q) => q.gorselGerekli).map((q) => q.id).join(' ')})`);
  if (cozulmemis.length) {
    console.log(`\n⚠ ÇÖZÜLMEMİŞ ${cozulmemis.length}:`);
    for (const c of cozulmemis) console.log(`   ${c}`);
  }
  writeFileSync(`${doc}/transkript/birlesik-${cikti.length}.json`, JSON.stringify(cikti, null, 1));
  console.log(`\n✓ ${doc}/transkript/birlesik-${cikti.length}.json`);
}
main();
