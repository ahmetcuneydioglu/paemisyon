/**
 * CSV'deki adreslere etiket ekler (kitle süzgeci için). Yalnız EMAIL sütunu okunur.
 *
 *   npx ts-node scripts/tag-email-contacts.ts --file ~/Downloads/liste.csv --tag brevo_first300            # prova
 *   npx ts-node scripts/tag-email-contacts.ts --file ... --tag ... --apply [--create-missing --source manual --consent brevo_list]
 *
 * --create-missing: tabloda olmayan adresler verilen kaynak/onay kaynağıyla yeni kişi olarak açılır.
 * İdempotent: var olan etiket yinelenmez, durum değişmez.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { normalizeEmail } from '../src/modules/email/contact-import.logic';

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const FILE = opt('file');
const TAG = opt('tag');
const APPLY = flag('apply');
const CREATE = flag('create-missing');
const SOURCE = (opt('source') ?? 'manual') as 'manual' | 'live_user' | 'legacy_paem705';
const CONSENT = opt('consent') ?? 'imported_list';
if (!FILE || !TAG || !/^[a-z0-9_-]{2,40}$/.test(TAG)) {
  console.error('--file ve --tag (küçük harf, rakam, _ -) zorunlu');
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
    select: { id: true, email: true, tags: true, status: true },
  });
  const have = new Map(existing.map((c) => [c.email, c]));
  const toTag = existing.filter((c) => !c.tags.includes(TAG!));
  const missing = emails.filter((e) => !have.has(e));
  console.log(APPLY ? '── UYGULAMA ──' : '── PROVA ──');
  console.log(
    `csv adres: ${emails.length} · tabloda: ${existing.length} · etiket eklenecek: ${toTag.length} · zaten etiketli: ${existing.length - toTag.length} · tabloda yok: ${missing.length}${CREATE ? ' (açılacak)' : ' (atlanır)'}`,
  );
  if (!APPLY) return;
  for (const c of toTag)
    await prisma.emailContact.update({ where: { id: c.id }, data: { tags: { push: TAG! } } });
  if (CREATE && missing.length) {
    await prisma.emailContact.createMany({
      skipDuplicates: true,
      data: missing.map((email) => ({
        email,
        source: SOURCE,
        status: 'subscribed',
        consentAt: new Date(),
        consentSource: CONSENT,
        tags: [TAG!],
        unsubscribeToken: randomBytes(32).toString('base64url'),
      })),
    });
  }
  const n = await prisma.emailContact.count({ where: { tags: { has: TAG! } } });
  console.log(`'${TAG}' etiketli kişi: ${n}`);
}
main()
  .catch((e) => {
    console.error('HATA:', (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
