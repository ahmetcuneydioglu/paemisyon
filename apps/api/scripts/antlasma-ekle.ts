/**
 * Uluslararası belgeyi (antlaşma, sözleşme, beyanname, statü) Mevzuat Merkezi'ne ekler.
 *
 * `mevzuat-ekle.ts` mevzuat.gov.tr PDF'ini ayrıştırır; uluslararası belgeler orada yoktur. Bunların resmî Türkçe
 * metni Resmî Gazete nüshasında (çoğu taranmış görüntü) durur ve MADDE DÖKÜMÜ olarak gelir: nüsha sayfa
 * görüntülerinden iki bağımsız okumayla çıkarılmış, farkları görüntüden hakemlenmiş JSON (Doc 56/08).
 * AİHS için yazılmış `aihs-import.ts`'in genel hâlidir.
 *
 * Anayasa md 90 uyarınca usulüne göre yürürlüğe konulmuş antlaşmalar kanun hükmündedir; `type=kanun` yazılır
 * (alan istemcide gösterilmez). Her belge derste kendi MEVZUAT KONUSUNU açar; bu konulara soru bağlanmaz.
 *
 *   cd apps/api && npx tsx scripts/antlasma-ekle.ts <config.json>            # kuru çalışma
 *   APPLY=1 npx tsx scripts/antlasma-ekle.ts <config.json>                    # taslak (draft) yaz
 *   APPLY=1 PUBLISH=1 npx tsx scripts/antlasma-ekle.ts <config.json>          # yayınla
 *
 * config: [{ "dokum": "/yol/dokum.json", "slug": "iheb", "ad": "İnsan Hakları Evrensel Beyannamesi",
 *            "kisa": "İHEB", "ders": "İnsan Hakları", "aliases": ["İHEB"], "keywords": ["evrensel beyanname"],
 *            "kaynakUrl": "https://www.resmigazete.gov.tr/arsiv/7217.pdf",
 *            "kunye": "27 Mayıs 1949 tarihli ve 7217 sayılı Resmî Gazete'de yayımlanan resmî Türkçe metin." }]
 * dokum: { "maddeler": [{ "articleNo": "Başlangıç" | "1" …, "title": "", "bolum": "", "text": "…" }] }
 *
 * Kapılar: madde numaraları tekil; "Başlangıç" dışındakiler 1'den başlayıp ardışık; boş ya da `[?]` içeren
 * (okunamamış) metin yazılmaz. Var olan belge (slug) yeniden yazılmaz; düzeltme panelden yapılır.
 * DB-yazma penceresi: connection_limit=1.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });
const APPLY = process.env.APPLY === '1';
const PUBLISH = process.env.PUBLISH === '1';

interface Madde {
  articleNo: string;
  title?: string;
  bolum?: string;
  text: string;
}
interface Hedef {
  dokum: string;
  slug: string;
  ad: string;
  kisa?: string;
  ders: string;
  aliases?: string[];
  keywords?: string[];
  kaynakUrl: string;
  kunye: string;
}

const BASLANGIC = 'Başlangıç';

/** Dökümün yazılabilir olup olmadığını denetler; sorunları döndürür (boşsa temiz). */
export function dokumSorunlari(maddeler: Madde[]): string[] {
  const sorun: string[] = [];
  const gorulen = new Set<string>();
  for (const m of maddeler) {
    if (gorulen.has(m.articleNo)) sorun.push(`çift madde: ${m.articleNo}`);
    gorulen.add(m.articleNo);
    if (!m.text?.trim()) sorun.push(`boş metin: md ${m.articleNo}`);
    else if (m.text.includes('[?]')) sorun.push(`okunamamış yer: md ${m.articleNo}`);
  }
  const sayilar = maddeler.filter((m) => m.articleNo !== BASLANGIC).map((m) => Number(m.articleNo));
  if (sayilar.some((n) => !Number.isInteger(n))) sorun.push('sayı olmayan madde numarası var');
  else sayilar.forEach((n, i) => n !== i + 1 && sorun.push(`sıra bozuk: ${i + 1}. sırada md ${n}`));
  return sorun;
}

async function main() {
  const dosya = process.argv[2];
  if (!dosya) throw new Error('kullanım: antlasma-ekle.ts <config.json>');
  const hedefler: Hedef[] = JSON.parse(readFileSync(dosya, 'utf8'));
  console.log(APPLY ? `MOD: YAZMA${PUBLISH ? ' + YAYIN' : ' (taslak)'}` : 'MOD: KURU ÇALIŞMA');

  for (const h of hedefler) {
    const maddeler: Madde[] = JSON.parse(readFileSync(h.dokum, 'utf8')).maddeler;
    const sorun = dokumSorunlari(maddeler);
    console.log(`\n── ${h.ad} (${h.slug})`);
    if (sorun.length) {
      console.log(`   ✗ döküm kapıdan geçmedi; ATLANDI:\n     ${sorun.slice(0, 12).join('\n     ')}`);
      continue;
    }
    const ders = await prisma.course.findFirst({
      where: { name: h.ders, deletedAt: null },
      select: { id: true, name: true, topics: { where: { deletedAt: null }, select: { sortOrder: true } } },
    });
    if (!ders) {
      console.log(`   ✗ "${h.ders}" dersi bulunamadı; ATLANDI`);
      continue;
    }
    const mevcut = await prisma.legislation.findUnique({ where: { slug: h.slug }, select: { id: true } });
    const bolumler = [...new Set(maddeler.map((m) => m.bolum?.trim()).filter(Boolean))] as string[];
    console.log(
      `   ${maddeler.length} kayıt · ${bolumler.length} bölüm · ders: ${ders.name} · ${mevcut ? 'ZATEN VAR' : 'yeni'}`,
    );
    if (!APPLY || mevcut) {
      if (mevcut) console.log('   dokunulmadı');
      continue;
    }

    const durum = PUBLISH ? 'published' : 'draft';
    const sira = Math.max(0, ...ders.topics.map((t) => t.sortOrder)) + 1;
    await prisma.$transaction(
      async (tx) => {
        const konu = await tx.topic.create({
          data: { courseId: ders.id, name: h.ad, sortOrder: sira, matchKeywords: h.keywords ?? [] },
          select: { id: true },
        });
        const belge = await tx.legislation.create({
          data: {
            slug: h.slug,
            type: 'kanun',
            name: h.ad,
            shortName: h.kisa ?? null,
            aliases: h.aliases ?? [],
            officialSourceUrl: h.kaynakUrl,
            effectiveInfo: h.kunye,
            status: durum,
            topicId: konu.id,
            sortOrder: sira,
            lastVerifiedAt: new Date(),
          },
          select: { id: true },
        });
        const bolumId = new Map<string, string>();
        for (const [i, b] of bolumler.entries()) {
          const s = await tx.legislationSection.create({
            data: { legislationId: belge.id, heading: b, sortOrder: i },
            select: { id: true },
          });
          bolumId.set(b, s.id);
        }
        await tx.lawArticle.createMany({
          data: maddeler.map((m, i) => ({
            topicId: konu.id,
            legislationId: belge.id,
            sectionId: m.bolum?.trim() ? (bolumId.get(m.bolum.trim()) ?? null) : null,
            articleNo: m.articleNo,
            title: m.title?.trim() || null,
            text: m.text.trim(),
            sortKey: i,
            sourceName: 'Resmî Gazete',
            sourceUrl: h.kaynakUrl,
            effectiveInfo: h.kunye,
            lastVerifiedAt: new Date(),
            status: durum,
          })),
        });
        console.log(`   ✓ yazıldı — konu ${konu.id}, ${maddeler.length} kayıt (${durum})`);
      },
      { timeout: 120_000 },
    );
  }
}

if (require.main === module) main().finally(() => prisma.$disconnect());
