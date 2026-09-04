/** SALT OKUMA: export-telegram.ts'nin hangi sorulari alacagini onceden gosterir. */
import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL!;
const url = base.includes('?') ? `${base}&connection_limit=1` : `${base}?connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

const YAYINDA = { deletedAt: null, currentVersionId: { not: null }, currentVersion: { status: 'published' } } as const;

async function main() {
  const toplam = await p.question.count({ where: YAYINDA });
  const ucretsiz = await p.question.count({ where: { ...YAYINDA, topic: { isPremium: false } } });
  console.log(`Yayinda soru:        ${toplam}`);
  console.log(`ONLY_FREE_TOPICS=true ile export edilecek: ${ucretsiz}`);
  console.log(`Premium konuda kalan (disarida): ${toplam - ucretsiz}\n`);

  const konular = await p.topic.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, isPremium: true, course: { select: { name: true } } },
  });
  const sayim = new Map<string, { free: number; prem: number }>();
  for (const t of konular) {
    const n = await p.question.count({ where: { ...YAYINDA, topicId: t.id } });
    if (!n) continue;
    const ders = t.course?.name ?? '(ders yok)';
    const g = sayim.get(ders) ?? { free: 0, prem: 0 };
    t.isPremium ? (g.prem += n) : (g.free += n);
    sayim.set(ders, g);
  }
  console.log('DERS'.padEnd(38), 'UCRETSIZ', 'PREMIUM');
  for (const [ders, g] of [...sayim].sort((a, b) => b[1].free + b[1].prem - a[1].free - a[1].prem))
    console.log(ders.padEnd(38), String(g.free).padStart(8), String(g.prem).padStart(8));
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
