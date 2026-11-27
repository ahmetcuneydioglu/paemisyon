/**
 * Doc 59 Aşama 5 — Düello yük sınaması (GERÇEK Postgres, gerçek motor).
 *
 * YALNIZ yerel veritabanında çalışır. Önce `duel-e2e.ts` bir kez koşmuş olmalı (soru havuzu ve
 * modül oradan gelir). Aynı anda SALON sayıda 8 kişilik salon ve DUELLO sayıda 1'e 1 maç oynatır;
 * her oyuncu saniyede bir durum yoklar ve her soruyu rastgele bir gecikmeyle cevaplar.
 *
 *   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54522/paemisyon_duel_test?connection_limit=4" \
 *     SALON=20 DUELLO=40 npx ts-node --transpile-only scripts/duel-yuk.ts
 *
 * `connection_limit=4` canlıdaki dar havuzu taklit eder (Supavisor 15, API'ye düşen pay).
 * Ölçülen: yoklama ve cevap gecikmesi (p50/p95/en kötü), hata sayısı, sonuçların tutarlılığı.
 */
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { BadgeService } from '../src/modules/coach/badge.service';
import { DuelEngineService } from '../src/modules/duel/duel-engine.service';
import { DuelQuestionsService } from '../src/modules/duel/duel-questions.service';

const url = process.env.DATABASE_URL ?? '';
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  console.error('DUR: bu betik yalnız yerel veritabanında çalışır.');
  process.exit(2);
}

const SALON = Number(process.env.SALON ?? 20);
const DUELLO = Number(process.env.DUELLO ?? 40);
const SORU = Number(process.env.SORU ?? 5);
const SANIYE = 5; // şemadaki alt sınır
const YOKLAMA_MS = Number(process.env.YOKLAMA_MS ?? 1000);

const prisma = new PrismaService();
const engine = new DuelEngineService(
  prisma,
  { send: async () => undefined } as never,
  new BadgeService(prisma),
);
const questions = new DuelQuestionsService(prisma);

const olcum = { state: [] as number[], answer: [] as number[] };
const hatalar = new Map<string, number>();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const yuzdelik = (a: number[], p: number) =>
  a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;

async function sure<T>(kova: number[], fn: () => Promise<T>): Promise<T | null> {
  const t = performance.now();
  try {
    const r = await fn();
    kova.push(performance.now() - t);
    return r;
  } catch (e) {
    const err = e as { getStatus?: () => number; code?: string; message?: string };
    // 409: soru o an kapandı (beklenen yarış). Diğer her şey gerçek hata.
    if (err.getStatus?.() === 409) return null;
    const ad = err.code ?? String(err.getStatus?.() ?? '') + ' ' + (err.message ?? '').slice(0, 60);
    hatalar.set(ad, (hatalar.get(ad) ?? 0) + 1);
    return null;
  }
}

async function oyuncu(matchId: string, userId: string) {
  let cevaplanan = -1;
  await wait(Math.random() * YOKLAMA_MS);
  for (let tur = 0; tur < 600; tur++) {
    const s = await sure(olcum.state, () => engine.state(matchId, userId));
    if (s && (s.phase === 'finished' || s.phase === 'cancelled')) return;
    if (s && s.phase === 'question' && s.question && cevaplanan < s.index) {
      cevaplanan = s.index;
      const index = s.index;
      const secenek = s.question.options[Math.floor(Math.random() * 5)].id;
      void wait(300 + Math.random() * 2500).then(() =>
        sure(olcum.answer, () => engine.answer(matchId, userId, index, secenek)),
      );
    }
    await wait(YOKLAMA_MS);
  }
}

async function main() {
  await prisma.$connect();
  const modul = await prisma.examType.findFirst({
    where: { name: 'Sınama Modülü' },
    orderBy: { createdAt: 'desc' },
  });
  if (!modul) throw new Error('Önce duel-e2e.ts çalıştır (sınama modülü yok).');
  await prisma.duelParticipant.updateMany({ where: { active: true }, data: { active: false } });

  const adet = SALON * 8 + DUELLO * 2;
  const ids = Array.from({ length: adet }, () => randomUUID());
  await prisma.user.createMany({
    data: ids.map((id, i) => ({
      id,
      email: `${id}@yuk.local`,
      displayName: `Yük ${i}`,
      preferredModuleId: modul.id,
      duelSeenAt: new Date(),
    })),
  });

  const maclar: { id: string; oyuncular: string[] }[] = [];
  let sira = 0;
  const kur = async (kind: 'room' | 'duel', n: number) => {
    const oyuncular = ids.slice(sira, sira + n);
    sira += n;
    const sorular = await questions.pick(modul.id, { kind: 'mixed', id: null }, SORU);
    const m = await prisma.$transaction((tx) =>
      engine.create(
        tx,
        {
          kind,
          moduleId: modul.id,
          scope: { kind: 'mixed', id: null },
          questions: sorular,
          secondsPerQuestion: SANIYE,
          maxPlayers: n,
          playerIds: oyuncular,
          startNow: true,
        },
        new Date(),
      ),
    );
    maclar.push({ id: m.id, oyuncular });
  };
  for (let i = 0; i < SALON; i++) await kur('room', 8);
  for (let i = 0; i < DUELLO; i++) await kur('duel', 2);

  console.log(
    `${maclar.length} maç, ${adet} oyuncu; ${SORU} soru × ${SANIYE} sn; yoklama ${YOKLAMA_MS} ms; havuz ${
      /connection_limit=(\d+)/.exec(url)?.[1] ?? 'varsayılan'
    }`,
  );
  const t0 = performance.now();
  await Promise.all(maclar.flatMap((m) => m.oyuncular.map((u) => oyuncu(m.id, u))));
  const gecen = (performance.now() - t0) / 1000;

  // ── Tutarlılık
  const mIds = maclar.map((m) => m.id);
  const bitmeyen = await prisma.duelMatch.count({
    where: { id: { in: mIds }, phase: { not: 'finished' } },
  });
  const odul = await prisma.xpEvent.count({ where: { sourceId: { in: mIds } } });
  const asili = await prisma.duelParticipant.count({
    where: { matchId: { in: mIds }, active: true },
  });
  const cift = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM (
      SELECT match_id, index, user_id FROM duel_answers
      WHERE match_id = ANY(${mIds}::uuid[]) GROUP BY 1, 2, 3 HAVING count(*) > 1) t`;
  const tutarsiz = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM duel_participants p
    WHERE p.match_id = ANY(${mIds}::uuid[])
      AND p.score <> (SELECT COALESCE(SUM(a.points), 0) FROM duel_answers a
                      WHERE a.match_id = p.match_id AND a.user_id = p.user_id)`;

  const satir = (ad: string, a: number[]) =>
    `${ad}: ${a.length} istek · p50 ${yuzdelik(a, 0.5).toFixed(0)} ms · p95 ${yuzdelik(a, 0.95).toFixed(0)} ms · en kötü ${Math.max(0, ...a).toFixed(0)} ms`;
  console.log(
    `Süre ${gecen.toFixed(1)} sn · ${((olcum.state.length + olcum.answer.length) / gecen).toFixed(0)} istek/sn`,
  );
  console.log(satir('Durum yoklaması', olcum.state));
  console.log(satir('Cevap', olcum.answer));
  console.log(`Hata: ${[...hatalar].map(([k, v]) => `${k} ×${v}`).join(', ') || 'yok'}`);
  const kontrol: [string, boolean][] = [
    ['bütün maçlar bitti', bitmeyen === 0],
    [`ödül satırı = oyuncu sayısı (${odul}/${adet})`, odul === adet],
    ['asılı aktif oyuncu yok', asili === 0],
    ['çift cevap yok', Number(cift[0].n) === 0],
    ['puan = cevap puanlarının toplamı', Number(tutarsiz[0].n) === 0],
    ['beklenmeyen hata yok', hatalar.size === 0],
  ];
  for (const [ad, ok] of kontrol) console.log(`  ${ok ? '✓' : '✗'} ${ad}`);

  // Yük kullanıcılarını temizle (cascade: katılım, cevap, istatistik, XP).
  await prisma.duelMatch.deleteMany({ where: { id: { in: mIds } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
  process.exit(kontrol.every(([, ok]) => ok) ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
