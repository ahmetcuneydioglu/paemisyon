/**
 * E-posta kişi listesini doldurur (docs/47-eposta-ses/02-tasarim.md §1, §3; Faz 3).
 *
 *  - live_user: users tablosundaki aktif, silinmemiş kullanıcılar (onay dayanağı:
 *    kayıt — ürün sahibi kararı D, 2 Eki 2026).
 *  - legacy_paem705: eski döküm; yeni sistemde hesabı olanlar canlı sayılır (karar A).
 *
 * Kullanım (apps/api içinden):
 *   npx ts-node scripts/import-email-contacts.ts --dump ../../paem705.sql           # prova (rapor)
 *   npx ts-node scripts/import-email-contacts.ts --dump ../../paem705.sql --apply
 *
 * Güvence: idempotent — var olan kişi yeniden yazılmaz, durumu DÜŞÜRÜLMEZ (çıkmış
 * kişi yeniden abone yapılmaz); yalnız boş ad/user_id tamamlanır. Pooler kuralı:
 * connection_limit=1.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import {
  normalizeEmail,
  parseLegacyUsers,
  planLegacyImport,
  summarizeSkips,
} from '../src/modules/email/contact-import.logic';

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const DUMP = opt('dump') ?? '../../paem705.sql';
const APPLY = flag('apply');

function withSingleConnection(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.includes('connection_limit=')
    ? url
    : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`;
}
const prisma = new PrismaClient({
  datasources: { db: { url: withSingleConnection(process.env.DATABASE_URL) } },
});

const token = () => randomBytes(32).toString('base64url');

async function main() {
  console.log(APPLY ? '── UYGULAMA ──' : '── PROVA (yazma yok) ──');

  // 1) Canlı kullanıcılar
  const users = await prisma.user.findMany({
    where: { deletedAt: null, status: 'active' },
    select: { id: true, email: true, displayName: true, createdAt: true },
  });
  const live = users
    .map((u) => ({ ...u, email: normalizeEmail(u.email) }))
    .filter((u) => u.email.includes('@'));
  const liveEmails = new Set(live.map((u) => u.email));
  console.log(`canlı kullanıcı        : ${live.length}`);

  // 2) Eski döküm
  const rows = parseLegacyUsers(readFileSync(DUMP, 'utf8'));
  const plan = planLegacyImport(rows, liveEmails);
  const skips = summarizeSkips(plan.skipped);
  console.log(`döküm satırı           : ${rows.length}`);
  console.log(`eski aday              : ${plan.candidates.length}`);
  console.log(`elenen                 : ${JSON.stringify(skips)}`);
  const byYear: Record<string, number> = {};
  for (const c of plan.candidates)
    byYear[c.legacyYear ?? 'yok'] = (byYear[c.legacyYear ?? 'yok'] ?? 0) + 1;
  console.log(`eski kayıt yılı dağılımı: ${JSON.stringify(byYear)}`);

  // 3) Mevcut kişiler (idempotency)
  const existing = await prisma.emailContact.findMany({
    select: { id: true, email: true, userId: true, displayName: true, source: true },
  });
  const existingByEmail = new Map(existing.map((c) => [c.email, c]));
  console.log(`tabloda mevcut kişi    : ${existing.length}`);

  const newLive = live.filter((u) => !existingByEmail.has(u.email));
  const newLegacy = plan.candidates.filter((c) => !existingByEmail.has(c.email));
  const fillUser = live.filter((u) => {
    const e = existingByEmail.get(u.email);
    return e && (e.userId !== u.id || (!e.displayName && u.displayName));
  });
  console.log(`eklenecek canlı        : ${newLive.length}`);
  console.log(`eklenecek eski         : ${newLegacy.length}`);
  console.log(`user_id/ad tamamlanacak: ${fillUser.length}`);

  if (!APPLY) {
    console.log('\nProva bitti. Yazmak için --apply.');
    return;
  }

  const now = new Date();
  const CHUNK = 500;
  for (let i = 0; i < newLive.length; i += CHUNK) {
    await prisma.emailContact.createMany({
      skipDuplicates: true,
      data: newLive.slice(i, i + CHUNK).map((u) => ({
        email: u.email,
        userId: u.id,
        displayName: u.displayName || null,
        source: 'live_user',
        status: 'subscribed',
        consentAt: u.createdAt,
        consentSource: 'app_registration',
        unsubscribeToken: token(),
      })),
    });
  }
  for (let i = 0; i < newLegacy.length; i += CHUNK) {
    await prisma.emailContact.createMany({
      skipDuplicates: true,
      data: newLegacy.slice(i, i + CHUNK).map((c) => ({
        email: c.email,
        displayName: c.displayName,
        source: 'legacy_paem705',
        legacyYear: c.legacyYear,
        status: 'subscribed',
        consentAt: now,
        consentSource: 'legacy_app_registration',
        unsubscribeToken: token(),
      })),
    });
  }
  for (const u of fillUser) {
    await prisma.emailContact.update({
      where: { email: u.email },
      data: {
        userId: u.id,
        displayName: existingByEmail.get(u.email)?.displayName ?? u.displayName ?? null,
      },
    });
  }

  const total = await prisma.emailContact.groupBy({
    by: ['source', 'status'],
    _count: { _all: true },
  });
  console.log('\nSonuç (kaynak × durum):');
  for (const t of total)
    console.log(`  ${t.source.padEnd(15)} ${t.status.padEnd(13)} ${t._count._all}`);
}

main()
  .catch((e) => {
    console.error('HATA:', (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
