/**
 * Doc 53 karar 8 — konu özeti ünitelerinin premium işaretini uygula: her kanunun ilk 2 ünitesi açık, kalanı premium
 * (kullanıcı talebi 18 Kas 2026).
 *
 *   cd apps/api && npx tsx scripts/ozet-premium-uygula.ts [--admin <e-posta>] [--uygula]
 *
 * Kural ünitenin kanun içindeki SIRASINA (`sortOrder`) bakar, yüklenmiş ünite sayısına değil: sıra 1 ve 2 açık,
 * 3 ve sonrası premium. Böylece kanunun 1. ünitesi henüz yüklenmemişken 3. ünite açık kalmaz, sonradan yüklenen
 * ünite de doğru yere düşer. Silinmemiş bütün üniteler (yayında + incelemede) kapsanır; betik idempotenttir,
 * yeni ünite yüklendikçe yeniden çalıştırılır (içe aktarma isPremium'u false açar). Sırası 1'den küçük ya da
 * kanun içinde tekrarlanan ünite varsa hiçbir şey yazılmaz.
 *
 * YAN ETKİ (Doc 56 karar 3): bilgi kartının kilidi bağlı olduğu ünitenin isPremium değeridir; premium olan
 * üniteye bağlı yayındaki kartlar premium olmayan kullanıcıya kilitlenir. Kuru çalıştırma bu sayıyı basar.
 * Tek `summary_unit.premium_many` denetim kaydı düşer. Varsayılan kuru çalıştırmadır; `--uygula` ile yazar.
 * DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient } from '@prisma/client';

const ACIK_UNITE = 2;

const args = process.argv.slice(2);
const uygula = args.includes('--uygula');
const aIdx = args.indexOf('--admin');
const adminEmail = aIdx >= 0 ? args[aIdx + 1] : '';
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  try {
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

    const units = await prisma.summaryUnit.findMany({
      where: { deletedAt: null },
      orderBy: [{ topic: { course: { sortOrder: 'asc' } } }, { legislationId: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        slug: true,
        sortOrder: true,
        isPremium: true,
        status: true,
        legislationId: true,
        legislation: { select: { name: true } },
        topic: { select: { course: { select: { name: true } } } },
      },
    });

    // Sıra denetimi: kural sıraya dayandığı için bozuk sıra yanlış üniteyi açar/kilitler.
    const kusur: string[] = [];
    const gorulen = new Map<string, string>();
    for (const u of units) {
      if (u.sortOrder < 1) kusur.push(`${u.slug}: sıra ${u.sortOrder} (1'den küçük)`);
      const k = `${u.legislationId}#${u.sortOrder}`;
      if (gorulen.has(k)) kusur.push(`${u.slug}: sıra ${u.sortOrder} ${gorulen.get(k)} ile aynı`);
      gorulen.set(k, u.slug);
    }
    if (kusur.length) {
      console.error('Sıra kusuru; hiçbir şey yazılmadı:');
      for (const k of kusur) console.error(`  ✗ ${k}`);
      process.exit(1);
    }

    const premiumYap: string[] = [];
    const acikYap: string[] = [];
    let grup = '';
    for (const u of units) {
      const g = `${u.topic.course.name} › ${u.legislation.name}`;
      if (g !== grup) {
        grup = g;
        console.log(`\n${g}`);
      }
      const hedef = u.sortOrder > ACIK_UNITE;
      const degisim = hedef === u.isPremium ? '' : hedef ? '  ← premium olacak' : '  ← açık olacak';
      if (hedef !== u.isPremium) (hedef ? premiumYap : acikYap).push(u.id);
      const durum = u.status === 'published' ? '' : ` [${u.status}]`;
      console.log(`  #${u.sortOrder} ${u.slug}${durum} · ${hedef ? 'premium' : 'açık'}${degisim}`);
    }

    // Yan etki: kilidi değişecek yayındaki bilgi kartları ve onları tekrar eden kullanıcılar.
    const kilitlenecek = premiumYap.length
      ? await prisma.flashcard.count({
          where: { deletedAt: null, status: 'published', summaryUnitId: { in: premiumYap } },
        })
      : 0;
    const acilacak = acikYap.length
      ? await prisma.flashcard.count({
          where: { deletedAt: null, status: 'published', summaryUnitId: { in: acikYap } },
        })
      : 0;
    const tekrarEden = premiumYap.length
      ? (
          await prisma.flashcardReview.findMany({
            where: {
              flashcard: { deletedAt: null, status: 'published', summaryUnitId: { in: premiumYap } },
            },
            distinct: ['userId'],
            select: { userId: true },
          })
        ).length
      : 0;

    console.log(
      `\nPremium olacak ${premiumYap.length} ünite · açık olacak ${acikYap.length} ünite · değişmeyen ${
        units.length - premiumYap.length - acikYap.length
      }`,
    );
    console.log(
      `Bilgi kartı etkisi: ${kilitlenecek} yayındaki kart premium olmayan kullanıcıya kilitlenecek` +
        ` (bu kartları tekrar eden ${tekrarEden} kullanıcı var; premium olanlar etkilenmez)` +
        (acilacak ? ` · ${acilacak} kartın kilidi açılacak` : ''),
    );

    if (!uygula) {
      console.log('Kuru çalıştırma; yazmak için --uygula.');
      return;
    }
    const [p, a] = await prisma.$transaction([
      prisma.summaryUnit.updateMany({ where: { id: { in: premiumYap } }, data: { isPremium: true } }),
      prisma.summaryUnit.updateMany({ where: { id: { in: acikYap } }, data: { isPremium: false } }),
    ]);
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'summary_unit.premium_many',
        entityType: 'summary_unit',
        entityId: null,
        detail: {
          via: 'scripts/ozet-premium-uygula.ts',
          rule: `Doc 53 karar 8: kanun içinde sıra <= ${ACIK_UNITE} açık, kalanı premium`,
          premium: premiumYap,
          open: acikYap,
          flashcardsLocked: kilitlenecek,
        },
      },
    });
    console.log(`Yazıldı: ${p.count} ünite premium · ${a.count} ünite açık.`);
  } finally {
    await prisma.$disconnect();
  }
})();
