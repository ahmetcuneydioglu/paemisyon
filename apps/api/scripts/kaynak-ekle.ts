/**
 * Doc 56 §12 — Kaynak metni (ders kitabı, resmî yayın) pasajlarıyla veritabanına yükle / güncelle.
 *
 *   cd apps/api && npx tsx scripts/kaynak-ekle.ts <kaynak.json>            (kuru çalıştırma: rapor)
 *   cd apps/api && APPLY=1 npx tsx scripts/kaynak-ekle.ts <kaynak.json>    (yazar)
 *
 * Kaynak metin, mevzuatı olmayan derslerde (İnkılap Tarihi, Silah Bilgisi…) bilgi kartının güven
 * dayanağıdır: kart madde yerine pasaja referans verir, sayılar pasaj metninde betikle doğrulanır.
 * Kaynağı İNSAN sağlar (PDF'i kullanıcı indirir; kazıma yok). Metin yalnız panelde ve doğrulayıcıda
 * kullanılır; hiçbir kullanıcı yüzeyine çıkmaz.
 *
 * kaynak.json:
 *   { "slug": "inkilap-tarihi-meb", "title": "İnkılap Tarihi — MEB ders kitabı",
 *     "label": "MEB, T.C. İnkılap Tarihi ve Atatürkçülük, 2024", "kind": "book", "url": null,
 *     "topicId": "<uuid>"  |  "konu": "<konu adı>",
 *     "passages": [ { "no": "2.3-01", "heading": "Sivas Kongresi", "page": "58", "text": "…" } ] }
 *
 * Eşleme pasaj numarasıyladır (`no`, kaynak içinde tekil). Güncellemede: yeni pasaj eklenir; metni değişen
 * pasaj güncellenir ve ona bağlı kartlar ESKİR (`staleSince`, yayın kapısı kapanır; kart panelde gözden
 * geçirilip kaydedilince açılır); dosyada olmayan pasaj, karta bağlı değilse silinir, bağlıysa işlem durur.
 * DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

interface KaynakJson {
  slug: string;
  title: string;
  label: string;
  kind?: 'book' | 'url';
  url?: string | null;
  topicId?: string;
  konu?: string;
  passages: { no: string; heading?: string | null; page?: string | null; text: string }[];
}

const file = process.argv[2];
if (!file) {
  console.error('kullanım: [APPLY=1] kaynak-ekle.ts <kaynak.json>');
  process.exit(2);
}
const uygula = process.env.APPLY === '1';
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });
const PASAJ_EN_AZ = 80;
const PASAJ_EN_COK = 6000;

(async () => {
  const k = JSON.parse(readFileSync(file, 'utf8')) as KaynakJson;
  try {
    if (!k.slug || !k.title || !k.label || !Array.isArray(k.passages) || !k.passages.length)
      throw new Error('slug, title, label ve en az bir pasaj zorunlu.');
    if (!/^[a-z0-9-]+$/.test(k.slug))
      throw new Error(`slug küçük harf/rakam/tire olmalı: ${k.slug}`);
    const nolar = new Set<string>();
    for (const p of k.passages) {
      if (!p.no?.trim() || !p.text?.trim())
        throw new Error(`pasaj no/metin boş: ${JSON.stringify(p).slice(0, 80)}`);
      if (nolar.has(p.no)) throw new Error(`pasaj numarası tekrar ediyor: ${p.no}`);
      nolar.add(p.no);
      const n = p.text.trim().length;
      if (n < PASAJ_EN_AZ)
        throw new Error(`pasaj ${p.no} çok kısa (${n} karakter); başlık artığı olabilir`);
      if (n > PASAJ_EN_COK) throw new Error(`pasaj ${p.no} çok uzun (${n} karakter); böl`);
    }
    // Konu AÇIKÇA verilmeli: boş değer Prisma'da "süzgeç yok" demektir ve kaynağı rastgele bir konuya bağlar.
    if (!k.topicId?.trim() && !k.konu?.trim()) throw new Error('topicId ya da konu zorunlu.');
    const topic = await prisma.topic.findFirst({
      where: k.topicId?.trim()
        ? { id: k.topicId.trim(), deletedAt: null }
        : { name: k.konu!.trim(), deletedAt: null },
      select: { id: true, name: true },
    });
    if (!topic) throw new Error(`Konu bulunamadı: ${k.topicId ?? k.konu}`);

    const mevcut = await prisma.sourceDocument.findFirst({
      where: { slug: k.slug },
      select: {
        id: true,
        topicId: true,
        deletedAt: true,
        passages: {
          select: {
            id: true,
            passageNo: true,
            text: true,
            _count: { select: { flashcards: true } },
          },
        },
      },
    });
    if (mevcut?.deletedAt) throw new Error(`Kaynak silinmiş durumda: ${k.slug}`);
    if (mevcut && mevcut.topicId !== topic.id)
      throw new Error('Kaynak başka bir konuya bağlı; konu değiştirilemez.');
    const eski = new Map((mevcut?.passages ?? []).map((p) => [p.passageNo, p]));
    const yeni = k.passages.filter((p) => !eski.has(p.no));
    const degisen = k.passages.filter(
      (p) => eski.has(p.no) && eski.get(p.no)!.text !== p.text.trim(),
    );
    const kalkan = [...eski.values()].filter((p) => !nolar.has(p.passageNo));
    const bagliKalkan = kalkan.filter((p) => p._count.flashcards > 0);
    const eskiyecek = degisen.reduce((s, p) => s + eski.get(p.no)!._count.flashcards, 0);

    const toplam = k.passages.reduce((s, p) => s + p.text.trim().length, 0);
    console.log(
      `Kaynak: ${k.title} [${k.slug}] → konu "${topic.name}"${mevcut ? ' (GÜNCELLEME)' : ' (YENİ)'}`,
    );
    console.log(
      `  ${k.passages.length} pasaj · ${toplam} karakter · ortalama ${Math.round(toplam / k.passages.length)}`,
    );
    console.log(
      `  yeni ${yeni.length} · metni değişen ${degisen.length} (eskiyecek kart ${eskiyecek}) · kalkan ${kalkan.length}`,
    );
    if (bagliKalkan.length)
      throw new Error(
        `Karta bağlı pasaj dosyada yok: ${bagliKalkan.map((p) => p.passageNo).join(', ')} — önce kartları taşı ya da arşivle.`,
      );
    if (!uygula) {
      console.log('Kuru çalıştırma; yazmak için APPLY=1.');
      return;
    }
    await prisma.$transaction(
      async (tx) => {
        const doc = mevcut
          ? await tx.sourceDocument.update({
              where: { id: mevcut.id },
              data: { title: k.title, label: k.label, kind: k.kind ?? 'book', url: k.url ?? null },
              select: { id: true },
            })
          : await tx.sourceDocument.create({
              data: {
                slug: k.slug,
                topicId: topic.id,
                title: k.title,
                label: k.label,
                kind: k.kind ?? 'book',
                url: k.url ?? null,
              },
              select: { id: true },
            });
        for (const [i, p] of k.passages.entries()) {
          const data = {
            heading: p.heading?.trim() || null,
            page: p.page?.trim() || null,
            text: p.text.trim(),
            sortKey: i,
          };
          const e = eski.get(p.no);
          if (e) await tx.sourcePassage.update({ where: { id: e.id }, data });
          else
            await tx.sourcePassage.create({
              data: { ...data, documentId: doc.id, passageNo: p.no },
            });
        }
        if (kalkan.length)
          await tx.sourcePassage.deleteMany({ where: { id: { in: kalkan.map((p) => p.id) } } });
        const degisenIds = degisen.map((p) => eski.get(p.no)!.id);
        if (degisenIds.length)
          await tx.flashcard.updateMany({
            where: {
              passages: { some: { passageId: { in: degisenIds } } },
              status: { not: 'archived' },
              staleSince: null,
            },
            data: { staleSince: new Date() },
          });
      },
      { timeout: 120_000, maxWait: 10_000 },
    );
    console.log(
      `✓ yazıldı — ${k.passages.length} pasaj${eskiyecek ? `, ${eskiyecek} kart eskidi` : ''}`,
    );
  } catch (e) {
    console.error(`HATA: ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
