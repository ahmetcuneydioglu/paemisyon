/**
 * Doc 36 — PAEM 10 hakemlik turunu kapatır ve kararları denetler.
 *
 * Hakem kararı bir metin dosyası olduğu için gözden kaçabilecek iki risk var,
 * ikisi de burada makineyle kapatılıyor:
 *
 *   1. KUYRUK AÇIK KALMASI — denetimden hakeme taşınan her soru karara
 *      bağlanmış olmalı; bir tanesi unutulursa yayına kusurlu soru sızar.
 *   2. SESSİZ ANAHTAR DEĞİŞİMİ — hakem kararındaki `anahtar` alanı, resmî
 *      kitapçıktan çıkarılan anahtarla AYNI olmak zorunda. Anahtar ancak
 *      `duzeltme` alanı doldurularak, gerekçesiyle birlikte değiştirilebilir.
 *      Bu ürün resmî sınavın kendisi; anahtarı sessizce çevirirsek kullanıcının
 *      aldığı puan gerçek sınavdaki puanıyla tutmaz.
 *
 * Çıktı: açıklama yazımına taşınacak kusur notları (`paem10-kusurlu.json`).
 * Doc 36'ya göre ürünün PDF'ten farkı açıklamalar olduğu için, kusurlu
 * soruların açıklaması kusuru SAKLAMAZ; not burada kayda geçer.
 *
 *   npx tsx scripts/paem10-hakem-kapat.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';

/** GECERLI: anahtar doğru, sorun yok. KUSURLU: soru kusurlu ama anahtar korunur.
 *  DENETCI-YANILDI: çelişkiyi denetçi çıkardı, anahtar sağlam. */
type KararTuru = 'GECERLI' | 'KUSURLU' | 'DENETCI-YANILDI';

type Hakem = {
  no: number;
  karar: KararTuru;
  anahtar: string;
  gerekce: string;
  duzeltme: string | null;
  kaynak: string;
  aciklamaNotu: string;
};

function main() {
  const sorular = JSON.parse(
    readFileSync(`${KOK}/ham/paem10-B-sorular.json`, 'utf8'),
  ) as { no: number; kok: string; dogru: string }[];
  const anahtarOf = new Map(sorular.map((s) => [s.no, s.dogru]));

  const kuyruk = JSON.parse(
    readFileSync(`${KOK}/denetim/paem10-hakemlik.json`, 'utf8'),
  ) as { no: number; kararlar: string[] }[];
  const kararlar = JSON.parse(
    readFileSync(`${KOK}/denetim/paem10-hakem-kararlari.json`, 'utf8'),
  ) as Hakem[];

  const kararOf = new Map(kararlar.map((k) => [k.no, k]));
  const hata: string[] = [];

  for (const q of kuyruk) {
    if (!kararOf.has(q.no)) hata.push(`${q.no}: hakeme taşındı ama karara bağlanmamış`);
  }
  for (const k of kararlar) {
    if (!kuyruk.some((q) => q.no === k.no)) {
      hata.push(`${k.no}: hakem kararı var ama denetimden hakeme taşınmamış`);
    }
    const resmi = anahtarOf.get(k.no);
    if (!resmi) hata.push(`${k.no}: soru bankasında yok`);
    else if (k.anahtar !== resmi && !k.duzeltme) {
      hata.push(
        `${k.no}: hakem anahtarı ${k.anahtar} yazmış, kitapçık ${resmi} — ` +
          `düzeltme gerekçesi olmadan anahtar değiştirilemez`,
      );
    }
    if (!k.aciklamaNotu?.trim()) hata.push(`${k.no}: açıklama notu boş`);
  }

  if (hata.length) {
    for (const h of hata) console.error(`  ✗ ${h}`);
    throw new Error(`hakemlik kapanmadı — ${hata.length} sorun`);
  }

  const sayim = new Map<KararTuru, number>();
  for (const k of kararlar) sayim.set(k.karar, (sayim.get(k.karar) ?? 0) + 1);

  console.log(`hakem kuyruğu: ${kuyruk.length} soru — hepsi karara bağlandı`);
  for (const [t, n] of [...sayim].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${t}`);
  }
  const cevrilen = kararlar.filter((k) => k.duzeltme);
  console.log(`anahtarı değiştirilen soru: ${cevrilen.length}`);

  // Açıklama yazımına taşınan notlar: kusurlular ÖNCE, çünkü onların
  // açıklaması ek yük taşıyor (kusuru dürüstçe anlatmak zorunda).
  const notlar = kararlar
    .map((k) => ({
      no: k.no,
      karar: k.karar,
      anahtar: k.anahtar,
      aciklamaNotu: k.aciklamaNotu,
      kaynak: k.kaynak,
    }))
    .sort((a, b) =>
      a.karar === b.karar ? a.no - b.no : a.karar === 'KUSURLU' ? -1 : 1,
    );
  writeFileSync(`${KOK}/denetim/paem10-aciklama-notlari.json`, JSON.stringify(notlar, null, 1));

  console.log('\nKUSURLU SORULAR (açıklaması kusuru anlatacak)');
  for (const k of kararlar.filter((x) => x.karar === 'KUSURLU')) {
    console.log(`  ${String(k.no).padStart(3)}  anahtar ${k.anahtar} korunuyor — ${k.kaynak}`);
  }
  console.log(`\n→ denetim/paem10-aciklama-notlari.json (${notlar.length} not)`);
}

main();
