/**
 * Doc 56 — İncelemedeki (in_review) bütün bilgi kartlarını TOPLU YAYINLA (kullanıcı kararı 13 Kas 2026).
 *
 *   cd apps/api && npx tsx scripts/kart-toplu-yayin.ts [--admin <e-posta>] [--uygula]
 *
 * Paneldeki toplu yayınla aynı kapı, kart başına (CLAUDE.md Doc 56 istisnası): eskimemiş ∧ mevzuat kontrolü
 * "yenilenmeli" değil ∧ betik doğrulaması (`validateCard`, canlı madde metni) temiz. Geçemeyen kart gerekçesiyle
 * ATLANIR ve in_review'da kalır. Panelden tek tek geçmek yerine mevzuat başına madde haritası bir kez yüklenir
 * (binlerce kartta fark eder). Yayın kararının sahibi `--admin` ile verilen admin kullanıcıdır (publishedBy +
 * tek `flashcard.publish_many` denetim kaydı). Varsayılan kuru çalıştırmadır; `--uygula` ile yazar.
 * DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';
import { validateCard, type FlashcardJson } from '../src/modules/flashcards/kart-dogrulayici';
import { loadRefMap, type RefMap } from '../src/modules/flashcards/kart-kaynak';

const args = process.argv.slice(2);
const uygula = args.includes('--uygula');
const aIdx = args.indexOf('--admin');
const adminEmail = aIdx >= 0 ? args[aIdx + 1] : '';
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  try {
    // Yayın kararının sahibi: --admin <e-posta> ile verilen admin; verilmezse sistemdeki TEK admin.
    const adminler = await prisma.user.findMany({
      where: {
        roles: { some: { role: { key: 'admin' } } },
        ...(adminEmail ? { email: adminEmail } : {}),
      },
      select: { id: true, email: true },
    });
    if (adminler.length !== 1)
      throw new Error(`Admin tek değil (${adminler.length}); --admin <e-posta> ile belirt.`);
    const admin = adminler[0];

    const cards = await prisma.flashcard.findMany({
      where: { status: 'in_review', deletedAt: null },
      select: {
        id: true,
        kind: true,
        front: true,
        back: true,
        explanation: true,
        difficulty: true,
        derivedNumbers: true,
        counterNumbers: true,
        legislationId: true,
        sourceDocumentId: true,
        staleSince: true,
        verificationStatus: true,
        topic: { select: { name: true } },
        articles: {
          select: {
            relation: true,
            lawArticle: { select: { articleNo: true, sortKey: true, legislationId: true } },
          },
        },
        passages: {
          select: { relation: true, passage: { select: { passageNo: true, sortKey: true } } },
        },
      },
    });
    console.log(`İncelemede ${cards.length} kart.`);

    // Dayanak başına (mevzuat ya da kaynak metin, Doc 56 §12) referans haritası bir kez yüklenir.
    const haritalar = new Map<string, RefMap>();
    const gecen: string[] = [];
    const atlanan: { id: string; konu: string; front: string; reason: string }[] = [];
    const konuSayim = new Map<string, { gecen: number; atlanan: number }>();
    const birincilOnce = (r: { relation: string }) => (r.relation === 'primary' ? -1 : 0);
    for (const c of cards) {
      const refs = [...c.articles].sort(
        (a, b) => birincilOnce(a) - birincilOnce(b) || a.lawArticle.sortKey - b.lawArticle.sortKey,
      );
      const pasajlar = [...c.passages].sort(
        (a, b) => birincilOnce(a) - birincilOnce(b) || a.passage.sortKey - b.passage.sortKey,
      );
      const legId = c.legislationId ?? refs[0]?.lawArticle.legislationId ?? null;
      const anahtar = c.sourceDocumentId
        ? `kaynak:${c.sourceDocumentId}`
        : legId
          ? `mevzuat:${legId}`
          : '';
      if (anahtar && !haritalar.has(anahtar))
        haritalar.set(
          anahtar,
          await loadRefMap(prisma, { sourceDocumentId: c.sourceDocumentId, legislationId: legId }),
        );
      const byNo: RefMap = anahtar ? haritalar.get(anahtar)! : new Map();
      const json: FlashcardJson = {
        kind: c.kind,
        front: c.front,
        back: c.back,
        explanation: c.explanation ?? undefined,
        difficulty: c.difficulty,
        articleRefs: refs.length
          ? refs.map((r) => r.lawArticle.articleNo)
          : pasajlar.map((r) => r.passage.passageNo),
        derivedNumbers: (c.derivedNumbers as FlashcardJson['derivedNumbers']) ?? undefined,
        counterNumbers: c.counterNumbers,
      };
      const v = validateCard(json, 0, byNo);
      const reasons: string[] = [];
      if (c.staleSince) reasons.push('eskimiş (referans madde değişti)');
      if (c.verificationStatus === 'needs_refresh') reasons.push('mevzuat kontrolü "yenilenmeli"');
      if (!v.ok) reasons.push(`doğrulama: ${v.issues.join('; ')}`);
      const s = konuSayim.get(c.topic.name) ?? { gecen: 0, atlanan: 0 };
      if (reasons.length) {
        atlanan.push({ id: c.id, konu: c.topic.name, front: c.front, reason: reasons.join(' · ') });
        s.atlanan++;
      } else {
        gecen.push(c.id);
        s.gecen++;
      }
      konuSayim.set(c.topic.name, s);
    }

    for (const [konu, s] of [...konuSayim].sort((a, b) => a[0].localeCompare(b[0], 'tr')))
      console.log(
        `  ${konu}: ${s.gecen} yayınlanacak${s.atlanan ? ` · ${s.atlanan} atlanacak` : ''}`,
      );
    console.log(`Kapıdan geçen ${gecen.length} · atlanan ${atlanan.length}`);
    for (const a of atlanan)
      console.log(`  ATLA [${a.konu}] ${a.front.slice(0, 70)} — ${a.reason.slice(0, 160)}`);

    if (!uygula) {
      console.log('Kuru çalıştırma; yazmak için --uygula.');
      return;
    }
    const now = new Date();
    let yazilan = 0;
    for (let i = 0; i < gecen.length; i += 500) {
      const r = await prisma.flashcard.updateMany({
        where: { id: { in: gecen.slice(i, i + 500) }, status: 'in_review', deletedAt: null },
        data: { status: 'published', publishedAt: now, publishedBy: admin.id },
      });
      yazilan += r.count;
    }
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'flashcard.publish_many',
        entityType: 'flashcard',
        entityId: null,
        detail: {
          via: 'scripts/kart-toplu-yayin.ts',
          publishedCount: yazilan,
          skipped: atlanan.map((a) => ({ id: a.id, reason: a.reason })),
        },
      },
    });
    console.log(`Yayınlandı: ${yazilan} kart · atlanan ${atlanan.length} (in_review'da kaldı).`);
  } finally {
    await prisma.$disconnect();
  }
})();
