/**
 * Kişi adı toplu düzeltme (13 Kas 2026, yayın öncesi Faz 1; kurallar src/common/kisi-adi.ts).
 *
 * Sorun: API adı yalnız user_metadata.display_name'den okuyordu; Google (full_name/name) ve
 * Apple (full_name) kullanıcılarının adı e-posta öneki oldu, Apple gizli adresinde anlamsız dizi.
 *
 * Kural: YALNIZ adı hâlâ yer tutucu olan satırlar (e-posta önekine eşit, boş ya da "Aday").
 *   - Supabase metadata'sında ad varsa (display_name → full_name → name) o yazılır.
 *   - Yoksa ve adres Apple gizli adresiyse "Aday" yazılır (önek kimseye anlam taşımaz).
 *   - Kullanıcının Ayarlar'dan verdiği ada ASLA dokunulmaz (yer tutucu değildir).
 *
 * Kullanım (varsayılan KURU çalışma, hiçbir şey yazmaz):
 *   npx ts-node --transpile-only scripts/ad-duzelt.ts
 *   npx ts-node --transpile-only scripts/ad-duzelt.ts --apply
 * Bağlantı connection_limit=1 (Supabase pooler sınırı, CLAUDE.md).
 */
import { PrismaClient } from '@prisma/client';
import { ANONIM_AD, isPlaceholderName, isRelayEmail, nameFromMetadata } from '../src/common/kisi-adi';

const base = process.env.DATABASE_URL!;
const url = base.includes('?') ? `${base}&connection_limit=1` : `${base}?connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const APPLY = process.argv.includes('--apply');

interface Row {
  id: string;
  email: string;
  display_name: string;
  provider: string | null;
  meta: unknown;
}

async function main() {
  const rows = await p.$queryRaw<Row[]>`
    SELECT u.id::text, u.email, u.display_name,
           a.raw_app_meta_data->>'provider' AS provider,
           a.raw_user_meta_data AS meta
    FROM public.users u
    JOIN auth.users a ON a.id = u.id
    WHERE u.deleted_at IS NULL`;

  const changes: { id: string; from: string; to: string; provider: string; kind: 'ad' | 'aday' }[] = [];
  for (const r of rows) {
    if (!isPlaceholderName(r.display_name, r.email)) continue;
    const fromMeta = nameFromMetadata(r.meta);
    const to = fromMeta ?? (isRelayEmail(r.email) ? ANONIM_AD : null);
    if (!to || to === r.display_name) continue;
    changes.push({ id: r.id, from: r.display_name, to, provider: r.provider ?? '?', kind: fromMeta ? 'ad' : 'aday' });
  }

  const by = new Map<string, { ad: number; aday: number }>();
  for (const c of changes) {
    const g = by.get(c.provider) ?? { ad: 0, aday: 0 };
    g[c.kind] += 1;
    by.set(c.provider, g);
  }
  console.log(`Taranan kullanıcı: ${rows.length}`);
  console.log(`Değişecek: ${changes.length}`);
  for (const [prov, g] of by) console.log(`  ${prov.padEnd(8)} gerçek ad: ${g.ad}  "Aday": ${g.aday}`);
  // Örnekler kişisel veri olduğu için yalnız biçim gösterilir (ad uzunluğu / kelime sayısı).
  const ornek = changes.slice(0, 5).map((c) => `${c.kind} · ${c.to.split(/\s+/).length} kelime`);
  console.log('Örnek biçimler:', ornek.join(' | '));

  if (!APPLY) {
    console.log('\nKURU ÇALIŞMA — yazılmadı. Uygulamak için --apply.');
    return;
  }
  let n = 0;
  for (let i = 0; i < changes.length; i += 200) {
    const parca = changes.slice(i, i + 200);
    await p.$transaction(
      parca.map((c) =>
        p.user.updateMany({
          // Yarış koruması: arada kullanıcı adını değiştirdiyse dokunma.
          where: { id: c.id, displayName: c.from },
          data: { displayName: c.to },
        }),
      ),
    );
    n += parca.length;
  }
  console.log(`\nYAZILDI: ${n} satır.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
