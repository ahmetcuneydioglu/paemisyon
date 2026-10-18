/**
 * Haftalık plan revizyonunu ELLE koşar (F8-A §3 cron'un aynısı — Pazartesi 04:40 TR).
 * Kullanım (apps/api içinden, pooler kuralı: connection_limit=1):
 *   DATABASE_URL="...?connection_limit=1" npx ts-node scripts/plan-revizyon-kos.ts [--now=2026-10-19T02:00:00Z] [--dry]
 * --dry: yalnız aktif planları ve geçen haftanın açık kalemlerini listeler, yazmaz.
 * --now: "şimdi" yerine verilen an (hafta kapanışını önceden denemek için).
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PlanService } from '../src/modules/plan/plan.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { haftaBasi } from '../src/common/gun';

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const dry = process.argv.includes('--dry');
const now = arg('now') ? new Date(arg('now')!) : new Date();

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const plan = app.get(PlanService);
  const buHafta = haftaBasi(now);
  const planlar = await prisma.studyPlan.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      userId: true,
      examDate: true,
      weeklyMinutes: true,
      _count: { select: { items: { where: { weekStart: { lt: buHafta }, status: 'pending' } } } },
    },
  });
  console.log(`now=${now.toISOString()} haftaBasi=${buHafta.toISOString().slice(0, 10)} aktif plan=${planlar.length}`);
  for (const p of planlar)
    console.log(
      `  plan ${p.id.slice(0, 8)} user ${p.userId.slice(0, 8)} sınav ${p.examDate?.toISOString().slice(0, 10) ?? '-'} ${p.weeklyMinutes} dk/hf — geçen haftadan açık kalem: ${p._count.items}`,
    );
  if (dry) {
    console.log('--dry: yazılmadı.');
  } else {
    const r = await plan.haftalikRevizyon(now);
    console.log('sonuç:', JSON.stringify(r));
  }
  await app.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
