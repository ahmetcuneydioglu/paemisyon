/**
 * CANLI DENEME YÜK TESTİ — N sanal katılımcı, gerçek API, gerçek veritabanı.
 *
 * Neyi ölçer: kalabalık bir denemede kırılma noktası nerede?
 *   1) KATILIM DALGASI  — herkes aynı anda "Başla"ya basar (exams/:id/start)
 *   2) CEVAP TRAFİĞİ    — pencereye yayılmış submitAnswer akışı
 *   3) BİTİŞ DALGASI    — asıl tehlike: sayaç sıfırlanınca herkesin
 *      completeSession'ı aynı saniyeye yığılır (ilerleme + streak + rozet
 *      yazımı). Prisma havuzu connection_limit kadardır; taşarsa istekler
 *      pool_timeout boyunca kuyrukta bekler, aşarsa P2024 → 500.
 *
 * ÖNCE: panelden yayında ve penceresi AÇIK bir deneme oluştur (yük testi için
 * AYRI bir deneme; sonunda scripts/deneme-iptal.ts ile iptal edilir).
 *
 *   npx tsx scripts/yuk-testi-deneme.ts --son --kisi 50   # en son yayındaki deneme
 *   npx tsx scripts/yuk-testi-deneme.ts --sinav <examId> --kisi 50
 *   npx tsx scripts/yuk-testi-deneme.ts --temizle          # sanal hesapları sil
 *
 * Seçenekler: --api <url> (varsayılan prod), --sure <sn> cevapların yayılacağı
 * süre (varsayılan 180), --kuru (hesap açmadan yalnız planı yazdırır).
 *
 * UYARI — tek makineden koşar: 'ip' katmanı uç başına 1500 istek/dk'dır ve
 * gerçek hayatta 50 kullanıcı 50 ayrı IP'den gelir. Buradaki 429'lar ölçüm
 * aracının sınırıdır, ürünün değil; rapor bunları ayrı sayar.
 *
 * Sanal hesaplar `yuk-test-<n>@paemisyon.test` desenlidir; --temizle YALNIZ bu
 * deseni siler.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const arg = (a: string, d?: string) => {
  const i = process.argv.indexOf(a);
  return i === -1 ? d : process.argv[i + 1];
};
const API = arg('--api', 'https://api.paemisyon.com/api/v1')!;
const KISI = Number(arg('--kisi', '50'));
const SURE = Number(arg('--sure', '180'));
const ETIKET = 'yuk-test-';
const EPOSTA = (i: number) => `${ETIKET}${i}@paemisyon.test`;
const SIFRE = 'YukTest!2026-sabit';

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, '../.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]),
);
const SB = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

type Olcum = { ms: number; kod: number; not?: string; govde?: unknown };

const yuzde = (a: number[], p: number) =>
  a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;

function rapor(ad: string, o: Olcum[]) {
  const ms = o.map((x) => x.ms);
  const kod = o.reduce<Record<number, number>>((a, x) => ((a[x.kod] = (a[x.kod] ?? 0) + 1), a), {});
  console.log(
    `  ${ad.padEnd(12)} n=${String(o.length).padStart(4)}  ` +
      `p50 ${String(yuzde(ms, 0.5)).padStart(5)}ms  p95 ${String(yuzde(ms, 0.95)).padStart(5)}ms  ` +
      `max ${String(Math.max(0, ...ms)).padStart(5)}ms  ${JSON.stringify(kod)}`,
  );
  for (const h of o.filter((x) => x.kod >= 500 || x.kod === 0).slice(0, 3)) {
    console.log(`    ↳ ${h.kod}: ${h.not ?? ''}`);
  }
}

async function olc(u: string, init: RequestInit): Promise<Olcum> {
  const t = Date.now();
  try {
    const r = await fetch(u, init);
    const metin = await r.text();
    let govde: unknown;
    try {
      govde = JSON.parse(metin);
    } catch {
      govde = metin.slice(0, 200);
    }
    return {
      ms: Date.now() - t,
      kod: r.status,
      govde,
      not: r.ok ? undefined : JSON.stringify(govde).slice(0, 160),
    };
  } catch (e) {
    return { ms: Date.now() - t, kod: 0, not: String(e).slice(0, 160) };
  }
}

const sb = (yol: string, init: RequestInit = {}) =>
  fetch(`${SB}${yol}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

/** Sanal hesapları açar (zaten varsa yeniden kullanır) ve erişim token'ı alır. */
async function hesaplar(n: number) {
  const out: { i: number; token: string }[] = [];
  for (let i = 0; i < n; i += 10) {
    await Promise.all(
      Array.from({ length: Math.min(10, n - i) }, async (_, k) => {
        const idx = i + k;
        const email = EPOSTA(idx);
        // Zaten varsa 422 döner; yok sayılır.
        await sb('/auth/v1/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password: SIFRE,
            email_confirm: true,
            user_metadata: { full_name: `Yük Testi ${idx}` },
          }),
        });
        const g = await sb('/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: { Authorization: '' },
          body: JSON.stringify({ email, password: SIFRE }),
        });
        const t = (await g.json()) as { access_token?: string };
        if (t.access_token) out.push({ i: idx, token: t.access_token });
      }),
    );
  }
  return out.sort((a, b) => a.i - b.i);
}

/** Sanal hesapları ve bıraktıkları oturumları siler (yalnız yuk-test- deseni). */
async function temizle() {
  const p = new PrismaClient();
  try {
    const liste = await sb('/auth/v1/admin/users?per_page=500');
    const { users = [] } = (await liste.json()) as { users?: { id: string; email?: string }[] };
    const hedef = users.filter((u) => u.email?.startsWith(ETIKET));
    for (const u of hedef) await sb(`/auth/v1/admin/users/${u.id}`, { method: 'DELETE' });

    const app = await p.user.findMany({
      where: { email: { startsWith: ETIKET } },
      select: { id: true },
    });
    const ids = app.map((u) => u.id);
    const oturum = await p.quizSession.deleteMany({ where: { userId: { in: ids } } });
    const kullanici = await p.user.deleteMany({ where: { id: { in: ids } } });
    console.log(
      `Temizlendi — auth: ${hedef.length}, uygulama kullanıcısı: ${kullanici.count}, oturum: ${oturum.count}`,
    );
  } finally {
    await p.$disconnect();
  }
}

/** En son yayınlanan denemeyi seçer; penceresi kapalıysa uyarır. */
async function sonDeneme(): Promise<string | undefined> {
  const p = new PrismaClient();
  try {
    const e = await p.exam.findFirst({
      where: { status: 'published', deletedAt: null },
      orderBy: { startAt: 'desc' },
      select: { id: true, title: true, startAt: true, durationMinutes: true, isPremium: true },
    });
    if (!e) {
      console.log('Yayınlanmış deneme yok — panelden bir yük testi denemesi aç.');
      return undefined;
    }
    const bitis = new Date(e.startAt.getTime() + e.durationMinutes * 60_000);
    const now = new Date();
    const durum = now < e.startAt ? 'BAŞLAMADI' : now < bitis ? 'AKTİF' : 'BİTTİ';
    console.log(`Seçilen deneme: ${e.title}  (${e.id})  durum=${durum}  premium=${e.isPremium}`);
    if (durum !== 'AKTİF') {
      // toLowerCase yok: Türkçe'de "BİTTİ" → "bi̇tti̇" gibi bozuluyor.
      console.log(`DURDURULDU: deneme ${durum} — yük testi için penceresi AÇIK deneme gerekir.`);
      return undefined;
    }
    if (e.isPremium) {
      console.log('DURDURULDU: deneme premium\'a özel — sanal hesaplar ücretsiz olduğu için kapıdan döner.');
      return undefined;
    }
    return e.id;
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  if (process.argv.includes('--temizle')) return temizle();

  // examId'yi elle aramaya gerek yok: --son en güncel yayındaki denemeyi seçer
  // (panelde denemeyi açtığında adres çubuğunda /exams/<id> olarak da görünür).
  const examId = arg('--sinav') ?? (process.argv.includes('--son') ? await sonDeneme() : undefined);
  if (!examId) {
    return console.log('--son (en güncel yayındaki deneme) ya da --sinav <examId> ver.');
  }
  if (!SB || !KEY) return console.log('.env içinde SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yok.');

  console.log(`YÜK TESTİ — ${KISI} sanal katılımcı, hedef ${API}`);
  if (process.argv.includes('--kuru')) {
    return console.log(
      `KURU: ${KISI} hesap açılacak, cevaplar ${SURE} sn'ye yayılacak, bitiş dalgası eşzamanlı.`,
    );
  }

  console.log('1/4 hesaplar hazırlanıyor…');
  const k = await hesaplar(KISI);
  console.log(`  token alınan: ${k.length}/${KISI}`);
  if (k.length === 0) return;

  console.log('2/4 KATILIM DALGASI (hepsi aynı anda Başla)…');
  const basla = await Promise.all(
    k.map(async (u) => ({
      ...(await olc(`${API}/exams/${examId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${u.token}` },
      })),
      u,
    })),
  );
  rapor('start', basla);
  const oturumlar = basla
    .map((b) => ({ u: b.u, d: (b.govde as { data?: any })?.data }))
    .filter((x) => x.d?.sessionId && Array.isArray(x.d?.questions) && x.d.questions.length > 0);
  console.log(`  açılan oturum: ${oturumlar.length}`);
  if (oturumlar.length === 0) return;

  console.log(`3/4 CEVAP TRAFİĞİ (${SURE} sn'ye yayılıyor)…`);
  const soruSayisi = oturumlar[0].d.questions.length;
  const aralik = (SURE * 1000) / Math.max(1, soruSayisi);
  const cevap: Olcum[] = [];
  for (let s = 0; s < soruSayisi; s++) {
    const t0 = Date.now();
    const tur = await Promise.all(
      oturumlar.map((o) => {
        const q = o.d.questions[s];
        const sik = q.options[(o.u.i + s) % q.options.length];
        return olc(`${API}/quiz/sessions/${o.d.sessionId}/answers`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${o.u.token}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            questionId: q.questionId,
            questionVersionId: q.versionId,
            selectedOptionId: sik.id,
            timeSpentMs: 1000 + ((o.u.i * 137 + s * 91) % 20000),
          }),
        });
      }),
    );
    cevap.push(...tur);
    if (s % 10 === 0) console.log(`  soru ${s + 1}/${soruSayisi}`);
    const bekle = aralik - (Date.now() - t0);
    if (bekle > 0) await new Promise((r) => setTimeout(r, bekle));
  }
  rapor('answers', cevap);

  console.log('4/4 BİTİŞ DALGASI (hepsi aynı saniyede bitir)…');
  const bitir = await Promise.all(
    oturumlar.map((o) =>
      olc(`${API}/quiz/sessions/${o.d.sessionId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${o.u.token}` },
      }),
    ),
  );
  rapor('complete', bitir);
  rapor('leaderboard', [await olc(`${API}/exams/${examId}/leaderboard`, {})]);

  const hepsi = [...basla, ...cevap, ...bitir];
  const t429 = hepsi.filter((x) => x.kod === 429).length;
  const t5xx = hepsi.filter((x) => x.kod >= 500 || x.kod === 0).length;
  console.log(`\nÖZET: 5xx/bağlantı hatası = ${t5xx}   429 = ${t429} (tek makine artefaktı)`);
  console.log('Sonra: deneme-iptal.ts ile denemeyi iptal et, --temizle ile hesapları sil.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
