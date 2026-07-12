/**
 * paem705 → Paemisyon kullanıcı göçü (Doc 8 §7, karar: YALNIZCA paem705).
 *
 * Eski sistem kimliği Firebase'te tuttuğu için PAROLALAR TAŞINAMAZ:
 * kullanıcılar Supabase'e parolasız (girişi imkânsız hash ile) açılır;
 * ilk girişte "Şifremi unuttum" ile parola belirler veya (etkinleşince)
 * aynı e-postayla Google/Apple girişi kullanır.
 *
 * Kullanım (apps/api içinden):
 *   npx ts-node scripts/migrate-paem705-users.ts --dump ../../paem705.sql            # dry-run (rapor)
 *   npx ts-node scripts/migrate-paem705-users.ts --dump ../../paem705.sql --apply [--limit N]
 *   npx ts-node scripts/migrate-paem705-users.ts --rollback --yes                    # provayı geri al
 *
 * Güvence: idempotent (legacy_user_map + e-posta kontrolü) — iki kez çalıştırmak
 * mükerrer kayıt üretmez. Rollback yalnızca bu script'in açtığı kullanıcıları siler.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ── CLI ──
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const DUMP = opt('dump') ?? '../../paem705.sql';
const APPLY = flag('apply');
const ROLLBACK = flag('rollback');
const LIMIT = opt('limit') ? Number(opt('limit')) : Infinity;

// ── Dump ayrıştırma ──
interface LegacyUser {
  legacyId: string;
  email: string;
  name: string;
  type: string;
  registeredAt: Date | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function parseTuples(block: string): string[][] {
  const tuples: string[][] = [];
  let i = 0;
  while (i < block.length) {
    if (block[i] !== '(') { i++; continue; }
    i++;
    const fields: string[] = [];
    let cur = '';
    let inStr = false;
    for (; i < block.length; i++) {
      const c = block[i];
      if (inStr) {
        if (c === '\\') { cur += block[++i] ?? ''; continue; }
        if (c === "'") { inStr = false; continue; }
        cur += c;
      } else {
        if (c === "'") { inStr = true; continue; }
        if (c === ',') { fields.push(cur); cur = ''; continue; }
        if (c === ')') { fields.push(cur); tuples.push(fields); i++; break; }
        cur += c;
      }
    }
  }
  return tuples;
}

function loadDump(path: string) {
  const sql = readFileSync(path, 'utf8');
  const blocks = [...sql.matchAll(/INSERT INTO `users`[^;]*?VALUES\s*([\s\S]*?);\n/g)];
  const rows = blocks.flatMap((m) => parseTuples(m[1]));
  // Kolonlar: id, firebase_id, name, email, mobile, type, profile, fcm_id, coins, refer, friends, ip, status, date
  const all: LegacyUser[] = rows.map((r) => ({
    legacyId: (r[0] ?? '').trim(),
    email: (r[3] ?? '').trim().toLowerCase(),
    name: (r[2] ?? '').trim(),
    type: (r[5] ?? '').trim().toLowerCase(),
    registeredAt: (() => {
      const d = new Date((r[13] ?? '').trim());
      return Number.isNaN(d.getTime()) ? null : d;
    })(),
  }));

  const invalid = all.filter((u) => !EMAIL_RE.test(u.email));
  const valid = all.filter((u) => EMAIL_RE.test(u.email));

  // Mükerrer e-posta: en son kayıt kazanır (en güncel tercih/isim).
  const byEmail = new Map<string, LegacyUser>();
  for (const u of valid) {
    const prev = byEmail.get(u.email);
    if (!prev || (u.registeredAt?.getTime() ?? 0) >= (prev.registeredAt?.getTime() ?? 0)) {
      byEmail.set(u.email, u);
    }
  }
  return {
    total: all.length,
    invalidCount: invalid.length,
    duplicateCollapsed: valid.length - byEmail.size,
    candidates: [...byEmail.values()],
  };
}

// ── SQL yardımcıları (auth şeması Prisma modeli değil → raw) ──
const esc = (s: string) => s.replaceAll("'", "''");

async function insertAuthUsers(users: { id: string; email: string; createdAt: Date }[]) {
  if (users.length === 0) return;
  const values = users
    .map(
      (u) => `('00000000-0000-0000-0000-000000000000', '${u.id}'::uuid, 'authenticated',
        'authenticated', '${esc(u.email)}', '', now(), '${u.createdAt.toISOString()}', now(),
        '{"provider":"email","providers":["email"]}', '{"migrated_from":"paem705"}',
        '', '', '', '', '', '', '', '')`,
    )
    .join(',');
  await prisma.$executeRawUnsafe(`
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES ${values}`);
  const identities = users
    .map(
      (u) => `('${randomUUID()}'::uuid, '${u.id}'::uuid,
        '{"sub":"${u.id}","email":"${esc(u.email)}","email_verified":true}',
        'email', '${u.id}', now(), now())`,
    )
    .join(',');
  await prisma.$executeRawUnsafe(`
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES ${identities}`);
}

// ── Ana akış ──
async function migrate() {
  const report = loadDump(DUMP);
  console.log('── paem705 analizi ──');
  console.log(`toplam satır          : ${report.total}`);
  console.log(`geçersiz/boş e-posta  : ${report.invalidCount} (atlanır — e-postasız hesap açılamaz)`);
  console.log(`mükerrer birleştirildi: ${report.duplicateCollapsed} (en son kayıt kazandı)`);
  console.log(`aday                  : ${report.candidates.length}`);

  // Idempotency: zaten göç edilenler + yeni sistemde aynı e-postayla var olanlar.
  const migrated = new Set(
    (
      await prisma.legacyUserMap.findMany({
        where: { legacySource: 'ios_firebase' },
        select: { legacyId: true },
      })
    ).map((m) => m.legacyId),
  );
  const candidateEmails = report.candidates.map((c) => c.email);
  const existingEmails = new Set(
    (
      await prisma.user.findMany({
        where: { email: { in: candidateEmails } },
        select: { email: true },
      })
    ).map((u) => u.email.toLowerCase()),
  );
  // auth tarafında (ör. yeniden kayıt olmuş) var olanlar:
  const authRows = (await prisma.$queryRawUnsafe(
    `SELECT lower(email) AS email FROM auth.users WHERE lower(email) = ANY($1)`,
    candidateEmails,
  )) as { email: string }[];
  for (const r of authRows) existingEmails.add(r.email);

  const todo = report.candidates
    .filter((c) => !migrated.has(c.legacyId) && !existingEmails.has(c.email))
    .slice(0, LIMIT);
  const skippedMigrated = report.candidates.filter((c) => migrated.has(c.legacyId)).length;
  const skippedExisting = report.candidates.filter(
    (c) => !migrated.has(c.legacyId) && existingEmails.has(c.email),
  ).length;

  console.log(`daha önce göç edilmiş : ${skippedMigrated} (atlanır — idempotent)`);
  console.log(`yeni sistemde zaten var: ${skippedExisting} (atlanır — çakışma yok)`);
  console.log(`bu koşuda işlenecek   : ${todo.length}${Number.isFinite(LIMIT) ? ` (limit ${LIMIT})` : ''}`);

  if (!APPLY) {
    console.log('\nDRY-RUN — hiçbir şey yazılmadı. Uygulamak için --apply ekle.');
    return;
  }

  const userRole = await prisma.role.findUnique({ where: { key: 'user' } });
  if (!userRole) throw new Error("'user' rolü yok — önce seed çalıştır.");

  const BATCH = 100;
  let done = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.map((u) => ({
      ...u,
      newId: randomUUID(),
      createdAt: u.registeredAt ?? new Date(),
      displayName: u.name.length >= 2 ? u.name.slice(0, 128) : u.email.split('@')[0],
    })).slice(i, i + BATCH);

    await prisma.$transaction(async (tx) => {
      await insertAuthUsers(batch.map((b) => ({ id: b.newId, email: b.email, createdAt: b.createdAt })));
      await tx.user.createMany({
        data: batch.map((b) => ({
          id: b.newId,
          email: b.email,
          displayName: b.displayName,
          emailVerifiedAt: b.createdAt, // eski sistemde kullanılan e-posta — doğrulanmış sayılır
          createdAt: b.createdAt, // kıdem korunur
        })),
      });
      await tx.userRole.createMany({
        data: batch.map((b) => ({ userId: b.newId, roleId: userRole.id })),
      });
      await tx.entitlement.createMany({
        data: batch.map((b) => ({ userId: b.newId, isPremium: false })),
      });
      await tx.legacyUserMap.createMany({
        data: batch.map((b) => ({
          newUserId: b.newId,
          legacySource: 'ios_firebase' as const,
          legacyId: b.legacyId,
          legacyEmail: b.email,
          passwordResetRequired: true,
        })),
      });
    });
    done += batch.length;
    console.log(`  ... ${done}/${todo.length}`);
  }
  console.log(`\n✅ ${done} kullanıcı göç edildi (parolasız — ilk girişte sıfırlama gerekli).`);
}

async function rollback() {
  if (!flag('yes')) {
    console.log('Rollback TÜM paem705 göçünü siler. Emin isen --yes ekle.');
    return;
  }
  const maps = await prisma.legacyUserMap.findMany({ where: { legacySource: 'ios_firebase' } });
  const ids = maps.map((m) => m.newUserId);
  console.log(`geri alınacak: ${ids.length} kullanıcı`);
  const BATCH = 200;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const list = Prisma.join(chunk.map((id) => Prisma.sql`${id}::uuid`));
    await prisma.$executeRaw(Prisma.sql`DELETE FROM auth.identities WHERE user_id IN (${list})`);
    await prisma.$executeRaw(Prisma.sql`DELETE FROM auth.users WHERE id IN (${list})`);
    await prisma.legacyUserMap.deleteMany({ where: { newUserId: { in: chunk } } });
    await prisma.entitlement.deleteMany({ where: { userId: { in: chunk } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: chunk } } });
    await prisma.user.deleteMany({ where: { id: { in: chunk } } });
    console.log(`  ... ${Math.min(i + BATCH, ids.length)}/${ids.length}`);
  }
  console.log('✅ rollback tamam.');
}

(ROLLBACK ? rollback() : migrate())
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
