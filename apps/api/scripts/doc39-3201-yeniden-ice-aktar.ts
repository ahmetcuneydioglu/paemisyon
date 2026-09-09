/**
 * 3201 sayılı Emniyet Teşkilat Kanunu — resmî PDF'ten yeniden içe aktarma.
 *
 * NEDEN: mevcut `law_articles` kaydı bozuk. Metin PDF'ten sayfa sayfa alınırken
 * sayfa altındaki DİPNOT BLOĞU ile gövde metni karışmış; üç belirti doğmuş:
 *   1) Sayfanın son gövde satırı düşmüş  → 14 madde cümle ortasında kesik
 *      (md 1'in "…ordu kuvvetlerinden istifade eder" yüklemi yok).
 *   2) Dipnot bloğu madde gövdesine sızmış → 18 maddede metnin ortasında şerh.
 *   3) Şerh devamı sonraki maddenin başlığına yazılmış → 19 kirli `title`.
 * Ayrıca aralık maddeler ("Madde 28 – 33 –") ayrıştırılamamış ve kanunun
 * sonundaki DEĞİŞİKLİK TABLOSU'ndan hayalet madde üretilmiş (md 29'un gövdesi
 * tablodan bir parça).
 *
 * ANAYASA: madde metni AI ile üretilmez/özetlenmez — birebir resmî metin.
 * Bu script yalnız PDF metnini ayrıştırır; hiçbir cümle yeniden yazılmaz.
 *
 * Girdi, `pdftotext -layout` çıktısıdır:
 *   pdftotext -layout 1.3.3201.pdf 3201-ham.txt
 *
 *   npx tsx scripts/doc39-3201-yeniden-ice-aktar.ts <ham-metin> [--apply]
 *   APPLY=1 npx tsx scripts/doc39-3201-yeniden-ice-aktar.ts 3201-ham.txt
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

/** Kanunun kendi maddeleri burada biter; sonrası başka kanunların ekleri ve tablo. */
const EK_BOLUM = '4/6/1937 TARİH VE 3201 SAYILI KANUNA İŞLENEMEYEN HÜKÜMLER';
/** Dipnot işareti: satırın TAMAMI bir sayı ve GİRİNTİSİZ. Tablo hücreleri girintilidir. */
const DIPNOT_ISARETI = /^\d{1,3}$/;
/** "Madde 8 – ", "Madde 28 – 33 – ", "Ek Madde 29- ", "Geçici Madde 1 – " */
const MADDE_BASI = /^\s*(Ek Madde|Geçici Madde|Madde)\s+(\d+)\s*[–-]\s*(?:(\d+)\s*[–-]\s*)?(.*)$/;

type Madde = { articleNo: string; title: string | null; text: string };

/** Sayfa altındaki dipnot bloğunu atar, yalnız gövdeyi döndürür. */
function govde(ham: string): string {
  return ham.split('\f').map((sayfa) => {
    const satir = sayfa.split('\n');
    const i = satir.findIndex((l) => DIPNOT_ISARETI.test(l));
    // Sayfa sınırında boş satır bırakma: bir paragraf iki sayfaya bölündüğünde
    // araya boş satır girerse metinde olmayan bir paragraf kırılması doğar.
    return (i === -1 ? satir : satir.slice(0, i)).join('\n').replace(/^\n+|\n+$/g, '');
  }).join('\n');
}

/** "Madde 8" → "8" · "Ek Madde 29" → "Ek 29" · "Geçici Madde 1" → "Geçici 1" */
function kanonik(tur: string, no: number): string {
  if (tur === 'Ek Madde') return `Ek ${no}`;
  if (tur === 'Geçici Madde') return `Geçici ${no}`;
  return String(no);
}

/**
 * Madde başlığı: madde satırından geriye doğru, boş satırlar atlanarak bulunan
 * ilk dolu satır — ancak kendisinden önce de boş satır varsa (yani bir önceki
 * maddenin metninin devamı değilse) ve cümle/şerh görünümünde değilse.
 * Örn. "İntihap Encümeni", "Emniyet Makamları:", "Trafik araştırma merkezi:".
 */
function baslikAdayi(satirlar: string[], i: number): { title: string | null; satir: number } | null {
  let j = i - 1;
  while (j >= 0 && satirlar[j].trim() === '') j--;      // boş satırları atla
  if (j < 0) return null;
  const aday = satirlar[j].trim();
  // Normalde başlıktan önce boş satır vardır. Kaynak metinde bu her zaman
  // tutmuyor (md 87); o hâlde başlık sayılması için önceki satırın CÜMLE
  // BİTİRMİŞ olması ve adayın kısa olması aranır — yoksa metnin devamıdır.
  const oncekiSatir = (satirlar[j - 1] ?? '').trim();
  if (oncekiSatir !== '') {
    const bitmis = /[.!?:]$/.test(oncekiSatir.replace(/\d+$/, '').trim());
    if (!bitmis || aday.length > 80) return null;
  }
  if (aday.length > 120 || MADDE_BASI.test(aday)) return null;
  // Başlık sonundaki dipnot işaretleri ("… teşkilatı 1617") her kontrolden ÖNCE
  // atılır; aksi hâlde hem noktalama kontrolü şaşar (künye satırı "Sayfa: 317"
  // rakamla bittiği için başlık sanılır) hem birleşen işaretler yıl sanılır.
  const temiz = aday.replace(/\s*\d+$/, '').trim();
  if (!temiz) return null;
  // Bu kanunda başlıklar iki nokta ile bitebiliyor ("Emniyet Makamları:").
  // Künye satırından ("Yayımlandığı Düstur : Tertip: 3 Cilt: 18 Sayfa:") ayıran
  // ölçüt, iki noktanın YALNIZ sonda bulunmasıdır.
  const govdesi = temiz.replace(/:$/, '');
  if (govdesi.includes(':')) return null;
  if (/[.);,]$/.test(govdesi) || /^[a-zçğıöşü(]/.test(govdesi)) return null;
  if (/md\.\)|sayılı|\b(18|19|20)\d{2}\b/i.test(temiz)) return null;  // dipnot/şerh kuyruğu
  // Bölüm ayracı ("Geçici Maddeler") başlık DEĞİLDİR, ama önceki maddenin
  // gövdesine de karışmamalı: title null döner, kesim noktası yine de verilir.
  if (/^(Geçici|Ek)\s+Maddeler?$/i.test(temiz)) return { title: null, satir: j };
  return { title: govdesi, satir: j };   // sondaki iki nokta saklanmaz (banka biçimi)
}

function ayristir(metin: string): Madde[] {
  const kesim = metin.indexOf(EK_BOLUM);
  const satirlar = (kesim === -1 ? metin : metin.slice(0, kesim)).split('\n');
  const bulunan: { tur: string; bas: number; son: number; title: string | null; baslikSatiri: number; ilk: string; satir: number }[] = [];
  satirlar.forEach((l, i) => {
    const m = MADDE_BASI.exec(l);
    if (!m) return;
    const b = baslikAdayi(satirlar, i);
    bulunan.push({ tur: m[1], bas: Number(m[2]), son: m[3] ? Number(m[3]) : Number(m[2]), title: b?.title ?? null, baslikSatiri: b?.satir ?? i, ilk: m[4], satir: i });
  });

  const cikti: Madde[] = [];
  bulunan.forEach((b, k) => {
    // Sonraki maddenin BAŞLIK satırında kes: başlık, önceki maddenin metnine
    // karışmamalı (aksi hâlde hem gövdenin sonunda hem `title` alanında çıkar).
    const bitis = bulunan[k + 1]?.baslikSatiri ?? satirlar.length;
    const govdeMetni = [b.ilk, ...satirlar.slice(b.satir + 1, bitis)]
      .join('\n').split('\n').map((l) => l.trim()).join('\n')
      .replace(/\n{3,}/g, '\n\n').trim();
    // Aralık madde ("28 – 33") tek metni paylaşan birden çok maddedir.
    for (let n = b.bas; n <= b.son; n++)
      cikti.push({ articleNo: kanonik(b.tur, n), title: b.title, text: govdeMetni });
  });
  return cikti;
}

async function main() {
  const yol = process.argv[2];
  if (!yol) throw new Error('kullanım: doc39-3201-yeniden-ice-aktar.ts <pdftotext -layout çıktısı>');
  const yeni = ayristir(govde(readFileSync(yol, 'utf8')));
  const leg = await prisma.legislation.findFirstOrThrow({ where: { number: '3201' } });
  const mevcut = await prisma.lawArticle.findMany({
    where: { legislationId: leg.id, deletedAt: null },
    select: { id: true, articleNo: true, title: true, text: true },
  });
  const mevcutMap = new Map(mevcut.map((a) => [a.articleNo, a]));
  const yeniMap = new Map(yeni.map((a) => [a.articleNo, a]));

  const degisen = yeni.filter((y) => {
    const m = mevcutMap.get(y.articleNo);
    return m && (m.text.replace(/\s+/g, ' ').trim() !== y.text.replace(/\s+/g, ' ').trim() || (m.title ?? null) !== y.title);
  });
  const ayni = yeni.filter((y) => mevcutMap.has(y.articleNo) && !degisen.includes(y));
  const eklenecek = yeni.filter((y) => !mevcutMap.has(y.articleNo));
  const hayalet = mevcut.filter((m) => !yeniMap.has(m.articleNo));

  console.log(`PDF'ten ayrıştırılan : ${yeni.length} madde`);
  console.log(`DB'de mevcut         : ${mevcut.length} madde`);
  console.log(`  aynı kalacak       : ${ayni.length}`);
  console.log(`  DEĞİŞECEK          : ${degisen.length}`);
  console.log(`  yeni eklenecek     : ${eklenecek.length}  ${eklenecek.map((a) => a.articleNo).join(' ')}`);
  console.log(`  HAYALET (silinecek): ${hayalet.length}  ${hayalet.map((a) => a.articleNo).join(' ')}`);

  console.log('\n── DEĞİŞECEK MADDELER (metin uzunluğu: eski → yeni) ──');
  for (const y of degisen) {
    const m = mevcutMap.get(y.articleNo)!;
    const fark = y.text.length - m.text.length;
    const bayrak = fark > 20 ? 'METİN TAMAMLANDI' : fark < -20 ? 'dipnot temizlendi' : 'küçük düzeltme';
    console.log(`  md ${y.articleNo.padEnd(11)} ${String(m.text.length).padStart(5)} → ${String(y.text.length).padStart(5)}  (${fark >= 0 ? '+' : ''}${fark})  ${bayrak}`);
    if ((m.title ?? null) !== y.title) console.log(`      başlık: ${JSON.stringify(m.title)} → ${JSON.stringify(y.title)}`);
  }

  // İnceleme için ayrıştırma çıktısını dosyaya dök (DUMP=<yol>).
  if (process.env.DUMP) {
    writeFileSync(process.env.DUMP, yeni.map((a) => `### MADDE ${a.articleNo}${a.title ? ' — ' + a.title : ''}\n${a.text}`).join('\n\n'));
    console.log(`\n(ayrıştırma çıktısı yazıldı: ${process.env.DUMP})`);
  }
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile uygulanır)'); await prisma.$disconnect(); return; }

  await prisma.$transaction(async (tx) => {
    for (const y of degisen) {
      const m = mevcutMap.get(y.articleNo)!;
      await tx.lawArticle.update({ where: { id: m.id }, data: { text: y.text, title: y.title, lastVerifiedAt: new Date() } });
    }
    for (const h of hayalet) await tx.lawArticle.update({ where: { id: h.id }, data: { deletedAt: new Date() } });
    // Aralık maddelerden ("Madde 28 – 33 –") doğan, DB'de hiç bulunmayan maddeler.
    // Künye alanları kardeş maddelerden alınır; sortKey mevcut desene uyar (no × 100).
    if (eklenecek.length) {
      const ornek = await tx.lawArticle.findFirstOrThrow({ where: { legislationId: leg.id, deletedAt: null } });
      await tx.lawArticle.createMany({
        data: eklenecek.map((y) => ({
          legislationId: leg.id, topicId: ornek.topicId, articleNo: y.articleNo,
          text: y.text, title: y.title, sortKey: Number(y.articleNo) * 100,
          sourceName: ornek.sourceName, sourceUrl: ornek.sourceUrl,
          status: ornek.status, lastVerifiedAt: new Date(),
        })),
      });
    }
    console.log(`\n✓ ${degisen.length} madde güncellendi · ${eklenecek.length} madde eklendi · ${hayalet.length} hayalet madde düşürüldü`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
