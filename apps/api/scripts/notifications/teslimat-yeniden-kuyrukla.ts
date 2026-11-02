/**
 * Doc 52 — 'no_consent' ile bastırılmış bir e-posta teslimatını yeniden kuyruğa alır.
 * Kullanım (connection_limit=1):
 *   DATABASE_URL=... npx tsx scripts/notifications/teslimat-yeniden-kuyrukla.ts <deliveryId> [ISO zaman]
 * Hedef kullanıcının e-postasına çekilir ("—email" yer tutucusu kutu özetinde sayılmaz);
 * zaman verilmezse hemen. Gönderim kararı işçide EmailChannelService'tedir (kişi yoksa açar).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
  const [idArg, whenArg] = process.argv.slice(2);
  if (!idArg) throw new Error('kullanım: … <deliveryId> [ISO zaman]');
  const id = BigInt(idArg);
  const d = await prisma.notificationDelivery.findUniqueOrThrow({ where: { id } });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: d.userId },
    select: { email: true },
  });
  if (d.channel !== 'email' || d.status !== 'suppressed')
    throw new Error(`beklenen suppressed email teslimatı; bulunan ${d.channel}/${d.status}`);
  const nextAttemptAt = whenArg ? new Date(whenArg) : new Date();
  const row = await prisma.notificationDelivery.update({
    where: { id },
    data: { status: 'queued', suppressionReason: null, target: user.email, nextAttemptAt },
    select: { id: true, status: true, target: true, nextAttemptAt: true },
  });
  console.log(row);
}
main().finally(() => prisma.$disconnect());
