/**
 * "Posta kutusu dolu" adresleri bastırma — SES'in MailboxFull gecikme/geçici
 * bounce verdiği kişiler (eski listede pratikte terk edilmiş hesap) `suppressed`
 * olur. Soğuk listeye gönderimde Gmail itibarını korumak için (4 Eki 2026).
 * Kuyruktaki gönderimleri işçi zaten atlar: her gönderimden önce kişi durumu
 * yeniden okunur, `subscribed` değilse `skipped`.
 *
 * Çalıştırma (apps/api içinden, connection_limit=1):
 *   npx ts-node scripts/email-suppress-mailbox-full.ts           # kuru çalışma
 *   npx ts-node scripts/email-suppress-mailbox-full.ts --apply   # uygula
 */
import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<{ id: string; email: string; n: number }[]>`
    select c.id, c.email::text as email, count(*)::int as n
    from email_events e
    join email_contacts c on c.email = e.recipient
    where e.subtype ilike '%MailboxFull%'
      and c.status = 'subscribed'
    group by c.id, c.email
    order by n desc`;
  console.log(`MailboxFull olayı olan abone kişi: ${rows.length}`);
  const byDomain = new Map<string, number>();
  for (const r of rows) {
    const d = r.email.split('@')[1];
    byDomain.set(d, (byDomain.get(d) ?? 0) + 1);
  }
  console.log('alan adına göre:', Object.fromEntries([...byDomain].sort((a, b) => b[1] - a[1])));
  if (!APPLY) {
    console.log('Kuru çalışma — değişiklik yok. Uygulamak için --apply.');
    return;
  }
  const r = await prisma.emailContact.updateMany({
    where: { id: { in: rows.map((x) => x.id) }, status: 'subscribed' },
    data: { status: 'suppressed', unsubscribeReason: 'mailbox_full' },
  });
  console.log(`suppressed: ${r.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
