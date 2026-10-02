/**
 * Dış kaynaktan (Brevo raporu) çıkış ya da bounce listesini kişi tablosuna işler.
 *
 *   npx ts-node scripts/import-email-suppressions.ts --file ~/Downloads/x.csv --status unsubscribed --reason brevo_2026-08 [--apply]
 *   --status: unsubscribed | bounced | suppressed
 *
 * Yalnız EMAIL sütunu okunur. Durum yalnız KÖTÜLEŞTİRİLİR (subscribed → verilen durum);
 * zaten bounced/complained olan kişiye dokunulmaz. Tabloda olmayan adres, ileride
 * eklenirse de gönderim almasın diye verilen durumla kişi olarak açılır (source manual).
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { EmailContactStatus, PrismaClient } from '@prisma/client';
import { normalizeEmail } from '../src/modules/email/contact-import.logic';

const args = process.argv.slice(2);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const FILE = opt('file');
const STATUS = opt('status') as EmailContactStatus | undefined;
const REASON = opt('reason') ?? 'external_list';
const APPLY = args.includes('--apply');
if (!FILE || !STATUS || !['unsubscribed', 'bounced', 'suppressed'].includes(STATUS)) {
  console.error('--file ve --status (unsubscribed|bounced|suppressed) zorunlu');
  process.exit(1);
}

const url = process.env.DATABASE_URL ?? '';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes('connection_limit=')
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`,
    },
  },
});

async function main() {
  const lines = readFileSync(FILE!, 'utf8').split(/\r?\n/);
  const header = (lines[0] ?? '')
    .replace(/^﻿/, '')
    .split(/[;,]/)
    .map((h) => h.trim().replace(/^"|"$/g, '').toUpperCase());
  const col = Math.max(0, header.indexOf('EMAIL'));
  const emails = [
    ...new Set(
      lines
        .slice(1)
        .map((l) => normalizeEmail((l.split(/[;,]/)[col] ?? '').replace(/^"|"$/g, '')))
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)),
    ),
  ];
  const existing = await prisma.emailContact.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, status: true },
  });
  const have = new Set(existing.map((c) => c.email));
  const change = existing.filter((c) => c.status === 'subscribed');
  const keep = existing.filter((c) => c.status !== 'subscribed');
  const missing = emails.filter((e) => !have.has(e));
  console.log(APPLY ? '── UYGULAMA ──' : '── PROVA ──');
  console.log(
    `csv: ${emails.length} · tabloda: ${existing.length} · ${STATUS} yapılacak: ${change.length} · zaten kapalı: ${keep.length} (${keep.map((k) => k.status).join(',') || '-'}) · tabloda yok, ${STATUS} olarak açılacak: ${missing.length}`,
  );
  if (!APPLY) return;
  const now = new Date();
  for (const c of change) {
    await prisma.emailContact.update({
      where: { id: c.id },
      data:
        STATUS === 'unsubscribed'
          ? { status: 'unsubscribed', unsubscribedAt: now, unsubscribeReason: REASON }
          : { status: STATUS!, lastEventAt: now },
    });
  }
  if (missing.length) {
    await prisma.emailContact.createMany({
      skipDuplicates: true,
      data: missing.map((email) => ({
        email,
        source: 'manual',
        status: STATUS!,
        consentSource: REASON,
        ...(STATUS === 'unsubscribed' ? { unsubscribedAt: now, unsubscribeReason: REASON } : {}),
        unsubscribeToken: randomBytes(32).toString('base64url'),
      })),
    });
  }
  console.log('tamam');
}
main()
  .catch((e) => {
    console.error('HATA:', (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
