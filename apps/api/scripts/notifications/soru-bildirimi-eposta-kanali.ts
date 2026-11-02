/**
 * Doc 52 — `question_report_resolved` otomasyonuna e-posta kanalını işler (3 Kas 2026).
 * Ön ayar tohumu yalnız EKSİK kodu ekler; mevcut satır güncellenmez. Bu yüzden
 * prod satırı tek seferlik bu betikle preset'teki kanal/konu/gövdeye çekilir.
 *   DATABASE_URL=...&connection_limit=1 npx tsx scripts/notifications/soru-bildirimi-eposta-kanali.ts
 */
import { PrismaClient } from '@prisma/client';
import { AUTOMATION_PRESETS } from '../../src/modules/notifications/automation.presets';

const prisma = new PrismaClient();
async function main() {
  const p = AUTOMATION_PRESETS.find((x) => x.code === 'question_report_resolved')!;
  const row = await prisma.notificationAutomation.update({
    where: { code: p.code },
    data: { channels: p.channels, emailSubject: p.emailSubject, emailBody: p.emailBody },
    select: { code: true, status: true, channels: true, emailSubject: true },
  });
  console.log(row);
}
main().finally(() => prisma.$disconnect());
