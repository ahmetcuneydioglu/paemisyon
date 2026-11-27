/**
 * Doc 59 — Düello motoru uçtan uca sınaması (GERÇEK Postgres, gerçek servisler).
 *
 * YALNIZ yerel/geçici veritabanında çalışır: DATABASE_URL 127.0.0.1/localhost değilse durur.
 * Kendi tohum verisini kurar (modül, ders, konu, sorular, kullanıcılar); gerçek veri gerekmez.
 *
 *   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54522/paemisyon_duel_test \
 *     npx ts-node scripts/duel-e2e.ts
 *
 * Zaman: servisler sunucu saatini kullanır; "süre geçti" durumu maçın faz damgaları geriye
 * çekilerek kurulur (`geriSar`) — beklemeden, sunucu saatine dayalı gerçek kod yolu sınanır.
 */
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../src/infra/settings/settings.service';
import type { AuthenticatedUser } from '../src/modules/auth/auth.types';
import { BadgeService } from '../src/modules/coach/badge.service';
import { rankScore } from '../src/modules/coach/rank.logic';
import { DUEL_RULES } from '../src/modules/duel/duel.config';
import { DuelEngineService } from '../src/modules/duel/duel-engine.service';
import { DuelQuestionsService } from '../src/modules/duel/duel-questions.service';
import type { DuelBroadcast } from '../src/modules/duel/duel-realtime.service';
import { DuelSweeperService } from '../src/modules/duel/duel-sweeper.service';
import { DuelService } from '../src/modules/duel/duel.service';

const url = process.env.DATABASE_URL ?? '';
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  console.error('DUR: bu betik yalnız yerel veritabanında çalışır (DATABASE_URL yerel değil).');
  process.exit(2);
}

const prisma = new PrismaService();
const yayinlar: DuelBroadcast[] = [];
const realtime = { send: async (m: DuelBroadcast[]) => void yayinlar.push(...m) };
const settings = new SettingsService(prisma);
const badges = new BadgeService(prisma);
const engine = new DuelEngineService(prisma, realtime as never, badges);
const questions = new DuelQuestionsService(prisma);
/** Bildirim kuyruğunun yerine kayıt tutan sahte: karar akışı (tercih, tavan) ayrı sınanır. */
const bildirimler: {
  userId: string;
  category: string;
  title: string;
  dedupeKey?: string | null;
}[] = [];
const notifications = {
  enqueue: async (i: (typeof bildirimler)[number]) => void bildirimler.push(i),
};
const duel = new DuelService(prisma, settings, engine, questions, notifications as never);
const sweeper = new DuelSweeperService(prisma, engine);

let gecen = 0;
let kalan = 0;
function ok(kosul: unknown, ad: string) {
  if (kosul) {
    gecen++;
    console.log(`  ✓ ${ad}`);
  } else {
    kalan++;
    console.log(`  ✗ ${ad}`);
  }
}
async function hata(
  fn: () => Promise<unknown>,
): Promise<{ status: number; message: string } | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    const err = e as { getStatus?: () => number; message?: string };
    return { status: err.getStatus?.() ?? 500, message: err.message ?? String(e) };
  }
}

/** Maçın saatini `ms` ileri alır (faz damgalarını geriye çekerek). */
async function geriSar(matchId: string, ms: number) {
  await prisma.$executeRaw`
    UPDATE duel_matches
    SET phase_started_at = phase_started_at - make_interval(secs => ${ms / 1000}),
        phase_ends_at = phase_ends_at - make_interval(secs => ${ms / 1000})
    WHERE id = ${matchId}::uuid`;
}

let moduleId = '';
let digerModuleId = '';
let dersId = '';
let darKonuId = '';

async function tohum() {
  const m = await prisma.examType.create({
    data: { key: `t-${randomUUID()}`, name: 'Sınama Modülü' },
  });
  const m2 = await prisma.examType.create({
    data: { key: `t-${randomUUID()}`, name: 'Öteki Modül' },
  });
  moduleId = m.id;
  digerModuleId = m2.id;
  const bolum = await prisma.examSection.create({ data: { examTypeId: m.id, name: 'Bölüm' } });
  const ders = await prisma.course.create({ data: { name: 'Sınama Dersi' } });
  dersId = ders.id;
  await prisma.examSectionCourse.create({ data: { sectionId: bolum.id, courseId: ders.id } });
  const konular = [];
  for (let k = 0; k < 6; k++) {
    konular.push(
      await prisma.topic.create({
        data: { courseId: ders.id, name: `Konu ${k}`, matchKeywords: [] },
      }),
    );
  }
  const dar = await prisma.topic.create({
    data: { courseId: ders.id, name: 'Dar Konu', matchKeywords: [] },
  });
  darKonuId = dar.id;

  const soruEkle = async (topicId: string, n: number, sik = 5) => {
    const q = await prisma.question.create({ data: { topicId } });
    const v = await prisma.questionVersion.create({
      data: {
        questionId: q.id,
        versionNo: 1,
        stem: `Soru ${n}: aşağıdakilerden hangisi doğrudur?`,
        status: 'published',
        options: {
          create: Array.from({ length: sik }, (_, i) => ({
            label: 'ABCDE'[i],
            text: `Şık ${i}`,
            isCorrect: i === n % sik,
            sortOrder: i,
          })),
        },
      },
    });
    await prisma.question.update({ where: { id: q.id }, data: { currentVersionId: v.id } });
  };
  let n = 0;
  for (const k of konular) for (let i = 0; i < 8; i++) await soruEkle(k.id, n++);
  for (let i = 0; i < 3; i++) await soruEkle(dar.id, n++); // yetersiz havuz
  for (let i = 0; i < 12; i++) await soruEkle(dar.id, n++, 4); // dört şıklı: düelloya GİRMEZ

  for (const key of ['user', 'admin', 'beta']) {
    await prisma.role.upsert({ where: { key }, update: {}, create: { key, name: key } });
  }
  await settings.set(SETTING_KEYS.duelEnabled, 'true');
  await settings.set(SETTING_KEYS.duelFreeDailyLimit, '0');
}

async function kullanici(
  ad: string,
  mod = moduleId,
  isPremium = false,
): Promise<AuthenticatedUser> {
  const u = await prisma.user.create({
    // duelSeenAt: düello ekranını açmış sayılır (açmayan kullanıcı davet alamaz).
    data: {
      email: `${randomUUID()}@sinama.local`,
      displayName: ad,
      preferredModuleId: mod,
      duelSeenAt: new Date(),
    },
  });
  return { id: u.id, email: u.email, roles: [], isPremium };
}

async function dogruSik(matchId: string, index: number) {
  const q = await prisma.duelMatchQuestion.findUniqueOrThrow({
    where: { matchId_index: { matchId, index } },
    include: { version: { include: { options: true } } },
  });
  const yanlis = q.version.options.find((o) => o.id !== q.correctOptionId)!.id;
  return { dogru: q.correctOptionId, yanlis };
}

/** İki oyuncuyu eşleştirir ve geri sayımı geçirir. */
async function eslesmisMac(a: AuthenticatedUser, b: AuthenticatedUser) {
  await duel.enqueue(a);
  const r = await duel.enqueue(b);
  if (r.status !== 'matched') throw new Error('eşleşme beklenirdi');
  await geriSar(r.matchId, DUEL_RULES.countdownMs + 50);
  return r.matchId;
}

async function main() {
  await prisma.$connect();
  await tohum();

  console.log('\n1) İki oyuncu aynı anda eşleşme başlatır');
  {
    const [a, b] = await Promise.all([kullanici('Ayşe Kaya'), kullanici('Burak Demir')]);
    const [ra, rb] = await Promise.all([duel.enqueue(a), duel.enqueue(b)]);
    const matched = [ra, rb].filter((r) => r.status === 'matched');
    ok(matched.length === 1, 'biri kuyruğa girer, öteki onu bulur (tek maç)');
    const sa = await duel.queueStatus(a);
    const sb = await duel.queueStatus(b);
    ok(
      sa.status === 'matched' && sb.status === 'matched' && sa.matchId === sb.matchId,
      'ikisi de aynı maçta',
    );
    ok(
      (await prisma.duelQueue.count({ where: { userId: { in: [a.id, b.id] } } })) === 0,
      'kuyruk temiz',
    );
    ok(
      yayinlar.filter((y) => y.event === 'matched').length === 2,
      'iki oyuncunun kişisel kanalına "matched" yayını',
    );
    await duel.leave(a, (sa as { matchId: string }).matchId);
  }

  console.log('\n   Altı oyuncu aynı anda');
  {
    const us = await Promise.all(Array.from({ length: 6 }, (_, i) => kullanici(`Oyuncu ${i}`)));
    await Promise.all(us.map((u) => duel.enqueue(u)));
    // kuyrukta tek kalanlar bir tur daha: gerçekte yoklama + yeni gelenler eşleştirir
    const rows = await prisma.duelParticipant.findMany({
      where: { userId: { in: us.map((u) => u.id) }, active: true },
    });
    const macBasina = new Map<string, number>();
    rows.forEach((r) => macBasina.set(r.matchId, (macBasina.get(r.matchId) ?? 0) + 1));
    ok(new Set(rows.map((r) => r.userId)).size === rows.length, 'hiçbir oyuncu iki maça verilmedi');
    ok(
      [...macBasina.values()].every((n) => n === 2),
      'her maç tam iki kişilik',
    );
    const kuyruk = await prisma.duelQueue.count({ where: { userId: { in: us.map((u) => u.id) } } });
    ok(
      rows.length + kuyruk === 6 && kuyruk <= 1,
      `altı oyuncu: ${rows.length / 2} maç, kuyrukta ${kuyruk}`,
    );
    for (const m of macBasina.keys())
      await engine.leave(m, rows.find((r) => r.matchId === m)!.userId);
    await prisma.duelQueue.deleteMany({});
  }

  console.log('\n2) Aynı kullanıcı iki cihazdan eşleşmeye çalışır');
  {
    const a = await kullanici('Tek Kişi');
    const r = await Promise.all([duel.enqueue(a), duel.enqueue(a)]);
    ok(
      r.every((x) => x.status === 'searching'),
      'kendisiyle eşleşmez',
    );
    ok((await prisma.duelQueue.count({ where: { userId: a.id } })) === 1, 'tek kuyruk kaydı');
    await duel.cancelQueue(a);
    ok((await duel.queueStatus(a)).status === 'idle', 'iptal sonrası kuyruk boş');
  }

  console.log('\n3) Salon 7 kişiyken iki kullanıcı aynı anda katılır');
  {
    const yedi = await Promise.all(Array.from({ length: 7 }, (_, i) => kullanici(`Salon ${i}`)));
    const [x, y] = await Promise.all([kullanici('Geç Gelen 1'), kullanici('Geç Gelen 2')]);
    const sorular = await questions.pick(moduleId, { kind: 'mixed', id: null }, 10);
    const salon = await prisma.$transaction((tx) =>
      engine.create(
        tx,
        {
          kind: 'room',
          moduleId,
          scope: { kind: 'mixed', id: null },
          questions: sorular,
          secondsPerQuestion: 20,
          maxPlayers: 8,
          playerIds: yedi.map((u) => u.id),
          hostId: yedi[0].id,
          isPublic: true,
          startNow: false,
        },
        new Date(),
      ),
    );
    const sonuc = await Promise.all([
      hata(() => engine.join(salon.id, x.id, moduleId)),
      hata(() => engine.join(salon.id, y.id, moduleId)),
    ]);
    ok(sonuc.filter((s) => s === null).length === 1, 'yalnız biri girer');
    ok(
      sonuc.some((s) => s?.status === 409 && /dolu/.test(s.message)),
      'öteki "Salon dolu" alır',
    );
    const icerde = await prisma.duelParticipant.count({
      where: { matchId: salon.id, leftAt: null },
    });
    ok(icerde === 8, 'salonda tam 8 kişi');

    console.log('\n8) Salon Başkanı ayrılır');
    await engine.leave(salon.id, yedi[0].id);
    const sonra = await prisma.duelMatch.findUniqueOrThrow({ where: { id: salon.id } });
    ok(sonra.hostId === yedi[1].id, 'başkanlık en eski kalan oyuncuya geçti');
    ok(sonra.phase === 'lobby', 'salon açık kaldı');
    const yeni = await kullanici('Başka Kurum', digerModuleId);
    const e = await hata(() => engine.join(salon.id, yeni.id, digerModuleId));
    ok(e?.status === 403, 'başka kurumun adayı salona giremez');
    await prisma.$transaction(async (tx) => {
      await engine.cancel(tx, await engine.lock(tx, salon.id), new Date());
    });
  }

  console.log('\n   Tam maç: puanlama ve cevap anahtarının gizliliği');
  let ornekMac = '';
  {
    const a = await kullanici('Kazanan Aday');
    const b = await kullanici('Kaybeden Aday');
    const matchId = await eslesmisMac(a, b);
    ornekMac = matchId;
    yayinlar.length = 0;
    let s = await duel.state(a, matchId);
    ok(s.phase === 'question' && s.index === 0, 'geri sayım bitince ilk soru açıldı');
    ok(s.question?.options.length === 5, 'soru beş şıkla geldi');
    const ham = JSON.stringify([s, ...yayinlar]);
    ok(
      !/isCorrect|is_correct|correctOptionId/.test(ham.replace(/"reveal":null/g, '')),
      'açık soruda yanıtta ve yayında cevap anahtarı YOK',
    );

    for (let i = 0; i < 10; i++) {
      const { dogru, yanlis } = await dogruSik(matchId, i);
      const ilk = await duel.answer(a, matchId, i, dogru);
      if (i === 0) {
        ok(
          ilk.phase === 'question' && ilk.reveal === null,
          'ilk cevaptan sonra soru açık, anahtar gizli',
        );
        ok(ilk.myOptionId === dogru, 'seçimim bana geri döner');
        ok(
          ilk.players.every((p) => p.score === 0),
          'açık soruda puan görünmez (doğruluk sızmaz)',
        );
        ok(
          ilk.players.find((p) => p.userId === a.id)?.answered === true,
          'rakip "cevapladı" bilgisini görür',
        );
      }
      s = await duel.answer(b, matchId, i, i < 3 ? dogru : yanlis);
      if (i === 0) {
        ok(s.phase === 'reveal', 'herkes cevaplayınca soru süre beklemeden kapandı');
        ok(s.reveal?.correctOptionId === dogru, 'doğru şık yalnız kapanışta açıklandı');
        ok(s.reveal?.results.length === 2, 'kapanışta herkesin seçimi görünür');
      }
      await geriSar(matchId, DUEL_RULES.revealMs + 50);
      s = await duel.state(a, matchId);
    }
    ok(s.phase === 'finished', '10 soru sonunda maç bitti');
    const pa = s.players.find((p) => p.userId === a.id)!;
    const pb = s.players.find((p) => p.userId === b.id)!;
    ok(pa.correctCount === 10 && pb.correctCount === 3, 'doğru sayıları 10 ve 3');
    ok(pa.score >= 1000 && pa.score <= 1500, `kazanan puanı 100×10 + hız bonusu (${pa.score})`);
    ok(pa.outcome === 'win' && pb.outcome === 'loss', 'kazanan ve kaybeden doğru');
    ok(pa.xp === 60 && pb.xp === 10, 'XP: +60 / +10');
    ok(
      (pa.ratingDelta ?? 0) > 0 && pa.ratingDelta === -(pb.ratingDelta ?? 0),
      'lig puanı simetrik',
    );
    ok(pb.wrongCount === 7 && pb.blankCount === 0, 'yanlış/boş sayımı');
    ok(s.players[0].name === 'Kazanan A.', 'başkasına görünen ad kısaltılır');

    console.log('\n11/16) Maç iki kez sonlandırılmaya / ödüller iki kez işlenmeye çalışılır');
    await prisma.$transaction(async (tx) => {
      const m = await engine.lock(tx, matchId);
      await engine.finalize(tx, m, new Date());
      await engine.finalize(tx, m, new Date());
    });
    await Promise.all([duel.state(a, matchId), duel.state(b, matchId), sweeper.sweep(new Date())]);
    ok(
      (await prisma.xpEvent.count({ where: { sourceId: matchId } })) === 2,
      'XP defterinde maç başına oyuncu başına tek satır',
    );
    const st = await prisma.duelStats.findUniqueOrThrow({ where: { userId: a.id } });
    ok(st.duels === 1 && st.wins === 1 && st.xpEarned === 60, 'istatistik bir kez işlendi');
    ok(
      st.currentStreak === 1 && st.rating === 1000 + (pa.ratingDelta ?? 0),
      'seri ve lig puanı tutarlı',
    );
    const yeniden = await hata(() =>
      prisma.xpEvent.create({
        data: { userId: a.id, source: 'duel', sourceId: matchId, amount: 60 },
      }),
    );
    ok(yeniden !== null, 'ikinci XP satırı veritabanında reddedilir (tekil anahtar)');
    ok((await duel.active(a)) === null, 'biten maç aktif sayılmaz; yeni maça girilebilir');
  }

  console.log('\n6/7) Süre bittikten sonra cevap; aynı soruya iki cevap');
  {
    const a = await kullanici('Cevap A');
    const b = await kullanici('Cevap B');
    const matchId = await eslesmisMac(a, b);
    const { dogru, yanlis } = await dogruSik(matchId, 0);
    await duel.state(a, matchId);
    const cift = await Promise.all([
      hata(() => duel.answer(a, matchId, 0, dogru)),
      hata(() => duel.answer(a, matchId, 0, yanlis)),
    ]);
    ok(
      cift.filter((c) => c === null).length === 1,
      'eşzamanlı iki cevaptan yalnız biri kabul edilir',
    );
    ok(
      cift.some((c) => c?.status === 409),
      'ikincisi 409 alır',
    );
    ok(
      (await prisma.duelAnswer.count({ where: { matchId, index: 0, userId: a.id } })) === 1,
      'veritabanında tek cevap',
    );
    ok(
      (await hata(() => duel.answer(a, matchId, 3, dogru)))?.status === 409,
      'açılmamış soruya cevap reddedilir',
    );
    const baskaSik = (await dogruSik(matchId, 1)).dogru;
    ok(
      (await hata(() => duel.answer(b, matchId, 0, baskaSik)))?.status === 400,
      'başka sorunun şıkkı reddedilir',
    );
    const yabanci = await kullanici('Yabancı');
    ok(
      (await hata(() => duel.answer(yabanci, matchId, 0, dogru)))?.status === 403,
      'maçta olmayan cevap veremez',
    );
    ok(
      (await hata(() => duel.state(yabanci, matchId)))?.status === 403,
      'maçta olmayan durumu göremez',
    );

    await geriSar(matchId, 20_000 + DUEL_RULES.answerGraceMs + 100);
    const gec = await hata(() => duel.answer(b, matchId, 0, dogru));
    ok(gec?.status === 409, 'süre bittikten sonra gelen cevap reddedilir');

    console.log('\n4/5/15) Bağlantı kopar, uygulama kapanıp açılır');
    const donus = await duel.active(b);
    ok(donus?.matchId === matchId, 'aktif maça geri dönülür');
    ok(donus?.phase === 'reveal' && donus.index === 0, 'kaçan soru süresi dolmuş sayıldı');
    await geriSar(matchId, 10 * 60_000);
    const cokSonra = await duel.active(b);
    ok(cokSonra === null, 'uzun süre sonra: maç sunucu saatine göre çoktan bitmiş');
    const son = await duel.state(b, matchId);
    ok(son.phase === 'finished', 'kimse bağlı değilken maç kendi kendine bitti');
    // Eşzamanlı iki cevaptan hangisinin kabul edildiği yarışa bağlı: sonuç ona göre beklenir.
    const kabul = await prisma.duelAnswer.findFirstOrThrow({
      where: { matchId, index: 0, userId: a.id },
    });
    ok(
      son.players.find((p) => p.userId === a.id)?.outcome === (kabul.isCorrect ? 'win' : 'draw'),
      'sonuç kabul edilen cevaba göre (doğruysa galibiyet, değilse beraberlik)',
    );

    console.log('\n10) İki oyuncu son soruyu aynı anda tamamlar');
    const c = await kullanici('Son C');
    const d = await kullanici('Son D');
    const m2 = await eslesmisMac(c, d);
    await prisma.duelMatch.update({ where: { id: m2 }, data: { questionCount: 1 } });
    const k = await dogruSik(m2, 0);
    await duel.state(c, m2);
    const birlikte = await Promise.all([
      hata(() => duel.answer(c, m2, 0, k.dogru)),
      hata(() => duel.answer(d, m2, 0, k.dogru)),
    ]);
    ok(
      birlikte.every((x) => x === null),
      'iki cevap da kabul edildi',
    );
    await geriSar(m2, DUEL_RULES.revealMs + 50);
    await Promise.all([duel.state(c, m2), duel.state(d, m2)]);
    ok(
      (await prisma.xpEvent.count({ where: { sourceId: m2 } })) === 2,
      'maç bir kez bitti, ödül bir kez yazıldı',
    );
  }

  console.log('\n9) Oyuncuların puanı eşit olur');
  {
    const a = await kullanici('Eşit A');
    const b = await kullanici('Eşit B');
    const matchId = await eslesmisMac(a, b);
    await geriSar(matchId, 60 * 60_000);
    const s = await duel.state(a, matchId);
    ok(
      s.players.every((p) => p.outcome === 'draw' && p.placement === 1),
      'tam eşitlik: berabere, ikisi de 1.',
    );
    ok(
      s.players.every((p) => p.xp === 25 && p.ratingDelta === 0),
      'beraberlik XP +25, lig puanı değişmez',
    );
    ok(
      s.players.every((p) => p.blankCount === 10),
      'cevaplanmayan sorular boş sayılır',
    );
  }

  console.log('\n   Oyun sırasında ayrılma');
  {
    const a = await kullanici('Kalan');
    const b = await kullanici('Kaçan');
    const matchId = await eslesmisMac(a, b);
    await duel.state(a, matchId);
    const { dogru } = await dogruSik(matchId, 0);
    await duel.answer(b, matchId, 0, dogru);
    await duel.leave(b, matchId);
    const s = await duel.state(a, matchId);
    ok(s.phase === 'finished', '1v1: rakip ayrılınca maç biter');
    ok(
      s.players.find((p) => p.userId === a.id)?.outcome === 'win',
      'puanı düşük olsa da kalan kazanır',
    );
    ok((await duel.active(b)) === null, 'ayrılan yeni maça girebilir');
  }

  console.log('\n12/13) Yanlış kod; yeterli soru yok');
  {
    const a = await kullanici('Kod Sahibi');
    const b = await kullanici('Kod Giren');
    ok((await hata(() => duel.joinWithCode(b, 'ZZZZZZ')))?.status === 404, 'yanlış kod 404');
    const lobi = await duel.createWithCode(a);
    ok(lobi.phase === 'lobby' && lobi.code?.length === 6, 'kodlu özel düello lobisi kuruldu');
    ok(
      (await hata(() => duel.createWithCode(a)))?.status === 409,
      'aktif maçı olan ikinci maç kuramaz',
    );
    const katil = await duel.joinWithCode(
      b,
      ` ${lobi.code!.toLowerCase().slice(0, 3)}-${lobi.code!.slice(3)} `,
    );
    ok(
      katil.phase === 'countdown' && katil.code === null,
      'ikinci oyuncu girince geri sayım başlar, kod kapanır',
    );
    const c = await kullanici('Üçüncü');
    ok(
      (await hata(() => duel.joinWithCode(c, lobi.code!)))?.status === 404,
      'kullanılmış kod yeniden geçmez',
    );
    await duel.leave(a, lobi.matchId);

    const eski = await duel.createWithCode(c);
    await prisma.duelMatch.update({
      where: { id: eski.matchId },
      data: { codeExpiresAt: new Date(Date.now() - 1000) },
    });
    const d = await kullanici('Geç Kalan');
    ok(
      (await hata(() => duel.joinWithCode(d, eski.code!)))?.status === 404,
      'süresi dolmuş kod 404',
    );
    await duel.leave(c, eski.matchId);
    ok(
      (await prisma.duelMatch.findUniqueOrThrow({ where: { id: eski.matchId } })).phase ===
        'cancelled',
      'kurucu ayrılınca lobi kapanır',
    );

    const yetersiz = await hata(() => duel.enqueue(d, 'topic', darKonuId));
    ok(
      yetersiz?.status === 409 && /yeterli soru yok/.test(yetersiz.message),
      `yetersiz havuz açıkça bildirilir: "${yetersiz?.message}"`,
    );
    ok(
      (await hata(() => duel.enqueue(d, 'course', randomUUID())))?.status === 400,
      'müfredat dışı ders reddedilir',
    );
    const dersle = await duel.enqueue(d, 'course', dersId);
    ok(dersle.status === 'searching', 'ders kapsamıyla kuyruğa girilir');
    const karisik = await duel.enqueue(await kullanici('Karışıkçı'));
    ok(karisik.status === 'searching', 'farklı konu seçenler birbiriyle eşleşmez');
    await prisma.duelQueue.deleteMany({});
  }

  console.log('\n   Davet');
  {
    const a = await kullanici('Davet Eden');
    const b = await kullanici('Davet Edilen');
    const d1 = await duel.invite(a, b.id);
    ok(!!d1.id, 'davet oluşturuldu');
    ok(
      (await hata(() => duel.invite(a, b.id)))?.status === 409,
      'aynı kişiye ikinci bekleyen davet reddedilir',
    );
    ok((await duel.listInvitations(b)).incoming.length === 1, 'davet alıcının listesinde');
    ok(
      (await hata(() => duel.respond(a, d1.id, true)))?.status === 404,
      'daveti gönderen kendi davetini kabul edemez',
    );
    const kabul = await Promise.all([
      hata(() => duel.respond(b, d1.id, true)),
      hata(() => duel.respond(b, d1.id, true)),
    ]);
    ok(kabul.filter((k) => k === null).length === 1, 'çift "kabul" tek maç kurar');
    const m = await duel.active(a);
    ok(m?.phase === 'countdown' && m.players.length === 2, 'iki oyuncu geri sayımda');
    await duel.leave(a, m!.matchId);

    const c = await kullanici('Engelleyen');
    await prisma.userBlock.create({ data: { blockerId: c.id, blockedId: a.id } });
    ok((await hata(() => duel.invite(a, c.id)))?.status === 403, 'engelleyen kişiye davet gitmez');
    await duel.enqueue(c);
    ok((await duel.enqueue(a)).status === 'searching', 'engelli çift hızlı eşleşmede de eşleşmez');
    await prisma.duelQueue.deleteMany({});
    const e = await kullanici('Öteki Kurum', digerModuleId);
    ok((await hata(() => duel.invite(a, e.id)))?.status === 403, 'başka kuruma davet gitmez');
    const d2 = await duel.invite(a, b.id);
    await prisma.duelInvitation.update({
      where: { id: d2.id },
      data: { expiresAt: new Date(Date.now() - 1) },
    });
    ok(
      (await hata(() => duel.respond(b, d2.id, true)))?.status === 409,
      'süresi dolmuş davet kabul edilemez',
    );
  }

  console.log('\n   Premium, günlük hak, bayrak');
  {
    await settings.set(SETTING_KEYS.duelFreeDailyLimit, '1');
    const a = await kullanici('Ücretsiz');
    const b = await kullanici('Premium', moduleId, true);
    const matchId = await eslesmisMac(a, b);
    await duel.leave(a, matchId);
    const sinir = await hata(() => duel.enqueue(a));
    ok(
      sinir?.status === 403 && /hakkın doldu/.test(sinir.message),
      'ücretsiz aday günlük hakkı dolunca durur',
    );
    ok((await duel.enqueue(b)).status === 'searching', 'premium sınırsız');
    const h = await duel.hub(a);
    ok(
      h.daily.remaining === 0 && h.daily.limit === 1 && h.stats.duels === 1,
      'merkez: kalan hak ve istatistik',
    );
    await prisma.duelQueue.deleteMany({});
    await settings.set(SETTING_KEYS.duelFreeDailyLimit, '0');

    await settings.set(SETTING_KEYS.duelEnabled, 'false');
    ok((await hata(() => duel.hub(a)))?.status === 404, 'bayrak kapalıyken uçlar 404');
    ok(!!(await duel.hub({ ...a, roles: ['beta'] })), 'beta rolü bayrak kapalıyken de görür');
    await settings.set(SETTING_KEYS.duelEnabled, 'true');
  }

  console.log('\n   Süpürücü: açıkta maç, lobi, davet, kuyruk kalmaz');
  {
    const a = await kullanici('Terk A');
    const b = await kullanici('Terk B');
    const matchId = await eslesmisMac(a, b);
    const lobi = await duel.createWithCode(await kullanici('Unutulan Lobi'));
    await prisma.duelMatch.update({
      where: { id: lobi.matchId },
      data: { createdAt: new Date(Date.now() - DUEL_RULES.lobbyTtlMs - 1000) },
    });
    await geriSar(matchId, 30 * 60_000);
    const r = await sweeper.sweep(new Date());
    ok(r.advanced >= 1 && r.lobbies >= 1, 'süpürücü terk edilmiş maçı ve lobiyi buldu');
    const m = await prisma.duelMatch.findUniqueOrThrow({ where: { id: matchId } });
    ok(m.phase === 'finished' && m.rewardedAt != null, 'terk edilen maç kapandı ve ödüllendirildi');
    ok(
      (await prisma.duelMatch.findUniqueOrThrow({ where: { id: lobi.matchId } })).phase ===
        'cancelled',
      'eski lobi iptal edildi',
    );
    ok(
      (await prisma.duelParticipant.count({ where: { active: true } })) === 0,
      'hiçbir oyuncu maçta asılı kalmadı',
    );
    ok(
      (await prisma.duelInvitation.count({
        where: { status: 'pending', expiresAt: { lte: new Date() } },
      })) === 0,
      'süresi dolmuş davet kalmadı',
    );
  }

  console.log('\n   Salon: kur, katıl, hazır, başlat, çıkar');
  {
    const baskan = await kullanici('Başkan Bey');
    const o = await Promise.all(
      Array.from({ length: 4 }, (_, i) => kullanici(`Salon Oyuncu ${i}`)),
    );
    ok(
      (await hata(() => duel.createRoom(baskan, { name: 'ab' })))?.status === 400,
      'kısa salon adı reddedilir',
    );
    ok(
      (await hata(() => duel.createRoom(baskan, { name: 'Deneme', questionCount: 12 })))?.status ===
        400,
      'geçersiz soru sayısı reddedilir',
    );
    const lobi = await duel.createRoom(baskan, {
      name: 'Gece Nöbeti',
      questionCount: 15,
      secondsPerQuestion: 30,
      maxPlayers: 4,
    });
    ok(
      lobi.kind === 'room' && lobi.phase === 'lobby' && lobi.code?.length === 6,
      'salon kuruldu, kod üretildi',
    );
    ok(
      lobi.questionCount === 15 && lobi.secondsPerQuestion === 30 && lobi.maxPlayers === 4,
      'ayarlar uygulandı',
    );
    ok(lobi.players[0].isHost && lobi.players[0].isReady, 'kuran başkan ve hazır');
    ok(
      (await duel.openRooms(o[0])).some((r) => r.matchId === lobi.matchId && r.players === 1),
      'herkese açık salon listede',
    );
    await duel.joinRoom(o[0], lobi.matchId);
    await duel.joinWithCode(o[1], lobi.code!);
    ok(
      (await hata(() => duel.start(baskan, lobi.matchId)))?.status === 409,
      'herkes hazır değilken başlatılamaz',
    );
    ok(
      (await hata(() => duel.start(o[0], lobi.matchId)))?.status === 403,
      'başkan olmayan başlatamaz',
    );
    await duel.ready(o[0], lobi.matchId, true);
    ok(
      (await hata(() => duel.kick(o[0], lobi.matchId, o[1].id)))?.status === 403,
      'başkan olmayan oyuncu çıkaramaz',
    );
    await duel.kick(baskan, lobi.matchId, o[1].id);
    ok(
      (await hata(() => duel.joinWithCode(o[1], lobi.code!)))?.status === 403,
      'çıkarılan oyuncu geri giremez',
    );
    ok((await duel.active(o[1])) === null, 'çıkarılan oyuncu serbest (yeni maça girebilir)');
    ok(
      (await hata(() => duel.start(baskan, lobi.matchId)))?.status === 409,
      'iki kişiyle başlatılamaz (en az 3)',
    );
    const dv = await duel.inviteToRoom(baskan, lobi.matchId, o[2].id);
    ok(
      (await duel.listInvitations(o[2])).incoming[0]?.roomId === lobi.matchId,
      'salon daveti alıcıya düştü',
    );
    const kabul = await duel.respond(o[2], dv.id, true);
    ok(
      kabul.status === 'accepted' && kabul.matchId === lobi.matchId,
      'davet kabul edilince salona girildi',
    );
    const guncel = await duel.updateRoom(baskan, lobi.matchId, {
      questionCount: 10,
      secondsPerQuestion: 20,
      maxPlayers: 4,
    });
    ok(
      guncel.questionCount === 10 &&
        guncel.players.filter((p) => !p.isHost).every((p) => !p.isReady),
      'ayar değişince hazırlar sıfırlandı',
    );
    ok(
      (await hata(() =>
        duel.updateRoom(baskan, lobi.matchId, {
          questionCount: 10,
          secondsPerQuestion: 20,
          maxPlayers: 3,
        }),
      )) === null,
      'sınır mevcut kişi sayısına indirilebilir',
    );
    ok(
      (await hata(() => duel.joinRoom(o[3], lobi.matchId)))?.status === 409,
      'sınırı dolan salona girilemez',
    );
    await duel.ready(o[0], lobi.matchId, true);
    await duel.ready(o[2], lobi.matchId, true);
    const basladi = await duel.start(baskan, lobi.matchId);
    ok(
      basladi.phase === 'countdown' && basladi.code === null,
      'başkan başlattı: geri sayım, kod kapandı',
    );
    ok(
      (await duel.openRooms(o[3])).every((r) => r.matchId !== lobi.matchId),
      'başlayan salon listeden düştü',
    );

    console.log('\n   Salon: canlı oyun, anlık sıralama, kürsü');
    const matchId = lobi.matchId;
    await geriSar(matchId, DUEL_RULES.countdownMs + 50);
    const sira = [baskan, o[0], o[2]]; // 10, 6, 2 doğru
    const hedef = [10, 6, 2];
    let s = await duel.state(baskan, matchId);
    for (let i = 0; i < 10; i++) {
      const { dogru, yanlis } = await dogruSik(matchId, i);
      for (let k = 0; k < 3; k++) {
        if (k === 2 && i >= 8) continue; // üçüncü oyuncu son iki soruyu boş geçer
        s = await duel.answer(sira[k], matchId, i, i < hedef[k] ? dogru : yanlis);
      }
      if (i === 0) {
        ok(s.phase === 'reveal', 'üç oyuncu da cevaplayınca soru kapandı');
        ok(
          s.players.filter((p) => p.score > 0).length === 3,
          'anlık sıralama için puanlar işlendi',
        );
      }
      if (i === 8) {
        ok(s.phase === 'question', 'biri cevaplamadıysa soru açık kalır');
        await geriSar(matchId, 20_000 + DUEL_RULES.answerGraceMs + 50);
      }
      if (i === 9) await geriSar(matchId, 20_000 + DUEL_RULES.answerGraceMs + 50);
      await geriSar(matchId, DUEL_RULES.revealMs + 50);
      s = await duel.state(baskan, matchId);
    }
    ok(s.phase === 'finished', 'salon maçı bitti');
    const yer = (u: AuthenticatedUser) => s.players.find((p) => p.userId === u.id)!;
    ok(
      yer(baskan).placement === 1 && yer(o[0]).placement === 2 && yer(o[2]).placement === 3,
      'kürsü sırası doğru',
    );
    ok(
      yer(baskan).xp === 100 && yer(o[0]).xp === 70 && yer(o[2]).xp === 50,
      'salon XP: 100 / 70 / 50',
    );
    ok(
      (yer(baskan).ratingDelta ?? 0) > 0 && (yer(o[2]).ratingDelta ?? 0) < 0,
      'salon puanı: birinci artar, sonuncu düşer',
    );
    ok(yer(o[2]).blankCount === 2 && yer(o[2]).wrongCount === 6, 'boş ve yanlış sayımı');
    const st = await prisma.duelStats.findUniqueOrThrow({ where: { userId: baskan.id } });
    ok(
      st.rooms === 1 && st.roomWins === 1 && st.duels === 0,
      "salon istatistiği 1v1'den ayrı tutulur",
    );

    console.log('\n5) Yanlışlarımı incele');
    const inc = await duel.review(o[0], matchId);
    ok(
      inc.wrongCount === 4 && inc.items.every((x) => x.myOptionId !== x.correctOptionId),
      'yalnız yanlış sorular gelir',
    );
    ok(
      inc.items.every((x) => x.options.length === 5 && !!x.correctOptionId),
      'bitmiş maçta doğru şık açıklanır',
    );
    const inc3 = await duel.review(o[2], matchId);
    ok(
      inc3.wrongCount === 8 && inc3.items.filter((x) => x.myOptionId === null).length === 2,
      'boş bırakılanlar da incelemede',
    );
    ok(
      (await hata(() => duel.review(o[3], matchId)))?.status === 403,
      'maçta olmayan incelemeyi göremez',
    );
    ok(
      (await hata(() => duel.review(o[1], matchId)))?.status === 403,
      'çıkarılan oyuncu incelemeyi göremez',
    );
    const acikMac = await eslesmisMac(await kullanici('İnc A'), o[3]);
    ok(
      (await hata(() => duel.review(o[3], acikMac)))?.status === 409,
      'süren maçta inceleme (anahtar) verilmez',
    );
    await duel.leave(o[3], acikMac);
  }

  console.log('\n   Hızlı salon');
  {
    await prisma.duelMatch.updateMany({ where: { phase: 'lobby' }, data: { phase: 'cancelled' } });
    await prisma.duelParticipant.updateMany({ where: { active: true }, data: { active: false } });
    const us = await Promise.all(Array.from({ length: 4 }, (_, i) => kullanici(`Hızlı ${i}`)));
    const [a, b] = await Promise.all([duel.quickRoom(us[0]), duel.quickRoom(us[1])]);
    ok(
      a.matchId === b.matchId,
      'aynı anda gelen iki oyuncu AYNI hızlı salona düşer (iki boş salon açılmaz)',
    );
    const c = await duel.quickRoom(us[2]);
    ok(c.matchId === a.matchId && c.players.length === 3, 'üçüncü oyuncu aynı salona katılır');
    await duel.ready(us[0], a.matchId, true);
    await duel.ready(us[1], a.matchId, true);
    let s = await duel.state(us[0], a.matchId);
    ok(s.phase === 'lobby', 'herkes hazır olmadan başlamaz');
    s = await duel.ready(us[2], a.matchId, true);
    ok(s.phase === 'countdown', 'üç kişi hazır olunca hızlı salon kendiliğinden başlar');
    const d = await duel.quickRoom(us[3]);
    ok(d.matchId !== a.matchId && d.phase === 'lobby', 'başlamış salona girilmez, yenisi açılır');
    await duel.leave(us[3], d.matchId);
    for (const u of us.slice(0, 3)) await duel.leave(u, a.matchId);
  }

  console.log('\n6) Sıralama, oyuncu arama, engelleme');
  {
    const ben = await kullanici('Sıra Bakan');
    const tum = await duel.leaderboard(ben, 'duel', 'all', 'module');
    ok(
      tum.top.length > 0 && tum.top.every((r, i) => i === 0 || tum.top[i - 1].points >= r.points),
      'tüm zamanlar: lig puanına göre sıralı',
    );
    ok(
      tum.me === null && /maçın yok/.test(tum.nextLine),
      'maçı olmayan tabloda yok, cümlesi sunucudan',
    );
    const hafta = await duel.leaderboard(ben, 'duel', 'week', 'module');
    ok(
      hafta.top.every((r, i) => i === 0 || hafta.top[i - 1].wins >= r.wins),
      'haftalık: galibiyete göre sıralı',
    );
    ok(hafta.pointsLabel === 'net puan' && tum.pointsLabel === 'lig', 'sütun adı sunucudan');
    const salon = await duel.leaderboard(ben, 'room', 'all', 'all');
    ok(
      salon.top.length >= 3 &&
        salon.top.every((r, i) => i === 0 || salon.top[i - 1].points >= r.points),
      'salon sıralaması ayrı tutulur',
    );
    const diger = await kullanici('Öteki Kurumlu', digerModuleId);
    ok(
      (await duel.leaderboard(diger, 'duel', 'all', 'module')).top.length === 0,
      '"Kurumum" yalnız kendi modülünü gösterir',
    );
    const kazanan = await prisma.user.findFirstOrThrow({ where: { displayName: 'Kazanan Aday' } });
    const k = {
      id: kazanan.id,
      email: kazanan.email,
      roles: [],
      isPremium: false,
    } as AuthenticatedUser;
    const benim = await duel.leaderboard(k, 'duel', 'all', 'module');
    ok(
      benim.me?.isMe === true && benim.me.name === 'Kazanan Aday',
      'kendi satırım tam adımla, sıramla gelir',
    );

    const hedef = await kullanici('Zeynep Arslan');
    await duel.hub(hedef); // çevrimiçi sinyali
    const ara = await duel.players(ben, 'zeyn');
    ok(
      ara.items.length === 1 && ara.items[0].name === 'Zeynep A.' && ara.items[0].online,
      'ada göre arama: kısaltılmış ad, çevrimiçi bayrağı',
    );
    ok((await duel.players(ben, 'z')).items.length === 0, 'tek harfle arama yapılmaz');
    ok(
      (await duel.players(ben)).items.some((p) => p.userId === hedef.id),
      'çevrimiçi listesinde görünür',
    );
    ok(
      (await duel.players(diger, 'zeyn')).items.length === 0,
      'başka kurumun adayı aramada çıkmaz',
    );
    await duel.invite(ben, hedef.id);
    ok(
      (await duel.players(ben, 'zeyn')).items[0].invited === true,
      'bekleyen davet listede işaretlenir',
    );
    await duel.block(hedef, ben.id);
    ok((await duel.players(ben, 'zeyn')).items.length === 0, 'beni engelleyen aramada görünmez');
    ok(
      (await duel.listInvitations(hedef)).incoming.length === 0,
      'engelleyince bekleyen davet kapanır',
    );
    ok((await duel.blocks(hedef)).length === 1, 'engellenenler listesi');
    await duel.unblock(hedef, ben.id);
    ok((await duel.players(ben, 'zeyn')).items.length === 1, 'engel kalkınca yeniden görünür');
  }

  console.log('\n   Aşama 4: XP rütbeye, rozetler, haftanın lideri');
  {
    const kazanan = await prisma.user.findFirstOrThrow({ where: { displayName: 'Kazanan Aday' } });
    const xp = await prisma.xpEvent.aggregate({
      where: { userId: kazanan.id },
      _sum: { amount: true },
    });
    ok(xp._sum.amount === 60, 'XP defterinde galibiyet +60');
    ok(rankScore(0, 0, xp._sum.amount ?? 0) === 60, "düello XP'si rütbe puanına eklenir");
    const rozet = await prisma.userBadge.findMany({ where: { userId: kazanan.id } });
    ok(
      rozet.some((r) => r.badgeKey === 'duel_win_1'),
      'maç bitince "İlk Galibiyet" rozeti verildi',
    );
    ok(!rozet.some((r) => r.badgeKey === 'duel_win_5'), 'eşiği dolmayan rozet verilmedi');
    const baskan = await prisma.user.findFirstOrThrow({ where: { displayName: 'Başkan Bey' } });
    ok(
      (await prisma.userBadge.count({
        where: { userId: baskan.id, badgeKey: 'room_champion' },
      })) === 1,
      'salon birincisine "Salon Şampiyonu" rozeti',
    );
    const vitrin = await badges.listForUser(kazanan.id);
    const seri = vitrin.items.find((b) => b.key === 'duel_streak_5');
    ok(
      seri?.earned === false && seri.progress === 1 && seri.threshold === 5,
      'vitrin: kilitli rozette ilerleme 1/5',
    );

    // Haftanın lideri: geçen haftaya üç bitmiş maç taşı
    const lider = await kullanici('Haftanın Adamı');
    const rakip = await kullanici('Haftalık Rakip');
    for (let i = 0; i < 3; i++) {
      const m = await eslesmisMac(lider, rakip);
      await duel.leave(rakip, m);
      await prisma.duelMatch.update({
        where: { id: m },
        data: { finishedAt: new Date(Date.now() - 8 * 86_400_000 + i * 60_000) },
      });
    }
    // sınama haftası sınırına takılmasın: "şimdi"yi bir hafta sonrası say
    const buHafta = await sweeper.awardWeeklyLeaders(new Date());
    const gecenHafta = await sweeper.awardWeeklyLeaders(new Date(Date.now() - 7 * 86_400_000));
    const liderRozeti = await prisma.userBadge.count({
      where: { userId: lider.id, badgeKey: 'duel_weekly' },
    });
    ok(
      liderRozeti === 1,
      `haftanın lideri rozeti verildi (bu hafta ${buHafta}, önceki ${gecenHafta})`,
    );
    await sweeper.awardWeeklyLeaders(new Date());
    await sweeper.awardWeeklyLeaders(new Date(Date.now() - 7 * 86_400_000));
    ok(
      (await prisma.userBadge.count({ where: { badgeKey: 'duel_weekly', userId: lider.id } })) ===
        1,
      'yeniden çalıştırmak ikinci rozet yazmaz',
    );
    ok(
      (await prisma.userBadge.count({ where: { badgeKey: 'duel_weekly', userId: rakip.id } })) ===
        0,
      'galibiyeti olmayan lider olmaz',
    );
  }

  console.log('\n   Aşama 4: arkadaşlık, bulunabilirlik, davet bildirimi');
  {
    const a = await kullanici('Arda Yılmaz');
    const b = await kullanici('Beren Çelik');
    ok((await duel.friendRequest(a, b.id)).state === 'sent', 'arkadaşlık isteği gönderildi');
    ok((await duel.friendRequest(a, b.id)).state === 'sent', 'aynı istek ikinci kez satır açmaz');
    ok((await duel.hub(b)).friendRequestCount === 1, 'merkezde bekleyen istek sayısı');
    ok((await duel.friends(b)).incoming[0]?.name === 'Arda Y.', 'gelen istek listede');
    ok(
      (await hata(() => duel.friendRespond(a, b.id, true)))?.status === 404,
      'isteği gönderen kendi isteğini kabul edemez',
    );
    ok((await duel.friendRespond(b, a.id, true)).state === 'friend', 'kabul edildi');
    ok((await duel.friends(a)).friends[0]?.friend === 'friend', 'iki taraf için arkadaş');
    const c = await kullanici('Cem Aksoy');
    const cift = await Promise.all([duel.friendRequest(a, c.id), duel.friendRequest(c, a.id)]);
    ok(
      (await prisma.friendship.count({ where: { OR: [{ userAId: c.id }, { userBId: c.id }] } })) ===
        1,
      'karşılıklı eşzamanlı istek tek satır',
    );
    ok(
      cift.some((x) => x.state === 'friend') ||
        (await duel.friendRequest(c, a.id)).state !== 'none',
      'karşılıklı istek arkadaşlığa döner',
    );

    await duel.updateSettings(b, { discoverable: false });
    ok(
      (await duel.players(c, 'beren')).items.length === 0,
      'bulunabilirlik kapalı: yabancı aramada göremez',
    );
    ok((await duel.players(a, 'beren')).items[0]?.friend === 'friend', 'arkadaşı yine görür');
    ok((await duel.hub(b)).settings.discoverable === false, 'tercih merkezde okunur');

    const eski = await prisma.user.create({
      data: {
        email: `${randomUUID()}@sinama.local`,
        displayName: 'Eski Sürüm',
        preferredModuleId: moduleId,
      },
    });
    ok(
      (await duel.players(a, 'eski')).items.length === 0,
      'düello ekranını hiç açmamış kullanıcı aramada çıkmaz',
    );
    ok((await hata(() => duel.invite(a, eski.id)))?.status === 403, 've davet alamaz');

    bildirimler.length = 0;
    await duel.invite(a, b.id); // b az önce merkez açtı: çevrimiçi
    ok(bildirimler.length === 0, 'çevrimiçi kişiye push gönderilmez (daveti canlı görür)');
    await prisma.user.update({
      where: { id: c.id },
      data: { duelSeenAt: new Date(Date.now() - 10 * 60_000) },
    });
    const dv = await duel.invite(a, c.id);
    ok(
      bildirimler.length === 1 &&
        bildirimler[0].userId === c.id &&
        bildirimler[0].category === 'duel',
      'çevrimdışı kişiye düello bildirimi kuyruklandı',
    );
    ok(bildirimler[0].dedupeKey === `duel-invite:${dv.id}`, 'bildirim davet başına tekil');
    ok(Date.parse(dv.expiresAt) - Date.now() > 5 * 60_000, 'çevrimdışı davet 10 dakika geçerli');

    await duel.block(b, a.id);
    ok(
      (await duel.friends(a)).friends.every((f) => f.userId !== b.id),
      'engelleyince arkadaşlık düşer',
    );
    ok(
      (await hata(() => duel.friendRequest(a, b.id)))?.status === 403,
      'engelleyene istek gönderilemez',
    );
    await duel.unfriend(a, c.id);
    ok((await duel.friends(a)).friends.length === 0, 'arkadaşlıktan çıkarma');
  }

  console.log('\n   Veritabanı kısıtları');
  {
    const rls = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
        AND (relname LIKE 'duel_%' OR relname IN ('xp_events', 'friendships', 'user_blocks'))`;
    ok(
      rls.length === 10 && rls.every((r) => r.relrowsecurity),
      'on yeni tablonun hepsinde RLS açık',
    );
    const pol = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM pg_policies WHERE schemaname = 'public'
        AND (tablename LIKE 'duel_%' OR tablename IN ('xp_events', 'friendships', 'user_blocks'))`;
    ok(Number(pol[0].n) === 0, 'politika yok: istemci rolleri hiçbir satıra erişemez');
    ok(!!ornekMac, 'örnek maç kimliği alındı');
  }

  console.log(`\n${gecen} geçti, ${kalan} kaldı.`);
  await prisma.$disconnect();
  process.exit(kalan === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
