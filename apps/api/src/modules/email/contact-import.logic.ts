/**
 * Kişi aktarımının saf (DB'siz) mantığı — docs/47-eposta-ses/02-tasarim.md §1, §3.
 *
 * İki kaynak:
 *  - live_user: yeni sistemin kullanıcıları (users). Onay dayanağı kayıt
 *    (ürün sahibi kararı D, 2 Eki 2026).
 *  - legacy_paem705: eski MySQL dökümündeki adresler. Yeni sistemde aynı adresle
 *    hesap varsa kişi live_user sayılır (karar A: eski/yeni karıştırılmaz,
 *    kayıtlı kullanıcıya "kayıt ol" daveti gitmez).
 *
 * Eleme kuralları adres adres gerekçelidir ki rapor okunabilsin.
 */

export type LegacyRow = {
  legacyId: string;
  email: string;
  name: string;
  registeredAt: Date | null;
};

export type SkipReason =
  'gecersiz_bicim' | 'rol_adresi' | 'apple_gizli_aktarma' | 'mukerrer' | 'canli_kullanici';

export type LegacyCandidate = {
  email: string;
  displayName: string | null;
  legacyYear: number | null;
  legacyId: string;
};

export type ImportPlan = {
  candidates: LegacyCandidate[];
  skipped: { email: string; reason: SkipReason }[];
};

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ROLE_LOCAL_PARTS = new Set([
  'info',
  'admin',
  'administrator',
  'destek',
  'support',
  'noreply',
  'no-reply',
  'postmaster',
  'abuse',
  'webmaster',
  'test',
  'sales',
  'satis',
  'iletisim',
  'contact',
]);

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isRoleAddress(email: string): boolean {
  const local = email.split('@')[0] ?? '';
  return ROLE_LOCAL_PARTS.has(local);
}

/**
 * Eski uygulamanın Apple kimliğine bağlı gizli aktarma adresleri yeni uygulamada
 * (farklı Bundle ID / takım) posta kabul etmez; baştan elenir.
 */
export function isApplePrivateRelay(email: string): boolean {
  return email.endsWith('@privaterelay.appleid.com');
}

/** MySQL dökümündeki `INSERT INTO \`users\` ... VALUES (...),(...)` bloklarını ayrıştırır. */
export function parseDumpTuples(block: string): string[][] {
  const tuples: string[][] = [];
  let i = 0;
  while (i < block.length) {
    if (block[i] !== '(') {
      i++;
      continue;
    }
    i++;
    const fields: string[] = [];
    let cur = '';
    let inStr = false;
    for (; i < block.length; i++) {
      const c = block[i];
      if (inStr) {
        if (c === '\\') {
          cur += block[++i] ?? '';
          continue;
        }
        if (c === "'") {
          inStr = false;
          continue;
        }
        cur += c;
      } else {
        if (c === "'") {
          inStr = true;
          continue;
        }
        if (c === ',') {
          fields.push(cur);
          cur = '';
          continue;
        }
        if (c === ')') {
          fields.push(cur);
          tuples.push(fields);
          i++;
          break;
        }
        cur += c;
      }
    }
  }
  return tuples;
}

/** Döküm metninden eski kullanıcı satırlarını çıkarır (kolonlar: id, firebase_id, name, email, …, date_registered). */
export function parseLegacyUsers(sql: string): LegacyRow[] {
  const blocks = [...sql.matchAll(/INSERT INTO `users`[^;]*?VALUES\s*([\s\S]*?);\n/g)];
  return blocks
    .flatMap((m) => parseDumpTuples(m[1]))
    .map((r) => {
      const d = new Date((r[13] ?? '').trim());
      return {
        legacyId: (r[0] ?? '').trim(),
        email: normalizeEmail(r[3] ?? ''),
        name: (r[2] ?? '').trim(),
        registeredAt: Number.isNaN(d.getTime()) ? null : d,
      };
    });
}

/**
 * Eski satırlardan aday listesi. `liveEmails` yeni sistemde kayıtlı adresler
 * (normalize edilmiş). Mükerrerde en son kayıt kazanır.
 */
export function planLegacyImport(rows: LegacyRow[], liveEmails: Set<string>): ImportPlan {
  const skipped: ImportPlan['skipped'] = [];
  const byEmail = new Map<string, LegacyRow>();

  for (const row of rows) {
    const email = row.email;
    if (!EMAIL_RE.test(email)) {
      skipped.push({ email, reason: 'gecersiz_bicim' });
      continue;
    }
    if (isRoleAddress(email)) {
      skipped.push({ email, reason: 'rol_adresi' });
      continue;
    }
    if (isApplePrivateRelay(email)) {
      skipped.push({ email, reason: 'apple_gizli_aktarma' });
      continue;
    }
    if (liveEmails.has(email)) {
      skipped.push({ email, reason: 'canli_kullanici' });
      continue;
    }
    const prev = byEmail.get(email);
    if (prev) {
      skipped.push({ email, reason: 'mukerrer' });
      if ((row.registeredAt?.getTime() ?? 0) >= (prev.registeredAt?.getTime() ?? 0)) {
        byEmail.set(email, row);
      }
      continue;
    }
    byEmail.set(email, row);
  }

  const candidates = [...byEmail.values()].map((r) => ({
    email: r.email,
    displayName: r.name || null,
    legacyYear: r.registeredAt ? r.registeredAt.getUTCFullYear() : null,
    legacyId: r.legacyId,
  }));

  return { candidates, skipped };
}

export function summarizeSkips(skipped: ImportPlan['skipped']): Record<SkipReason, number> {
  const out: Record<SkipReason, number> = {
    gecersiz_bicim: 0,
    rol_adresi: 0,
    apple_gizli_aktarma: 0,
    mukerrer: 0,
    canli_kullanici: 0,
  };
  for (const s of skipped) out[s.reason]++;
  return out;
}
