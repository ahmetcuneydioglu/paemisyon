/**
 * DENEME PROVASI — canlı denemeden önce motorun uçtan uca sınaması (13 Kas 2026).
 *
 * Neden: geçmiş canlı denemelerde oturumlar süre dolmadan kapandı, puanlar 0/eksi göründü
 * (28 Eki 2026 Paem11). Bu betik GERÇEK servis kodunu (ExamsService, QuizService, cron
 * yöntemleri) YEREL veritabanında koşturur, sanal adayların netini bağımsız hesaplar ve
 * sistemin sonucuyla karşılaştırır. Zaman yolculuğu: süre dolumu ve pencere kapanışı
 * beklenmez, oturumun bitiş anı geçmişe çekilip cron yöntemi elle çağrılır.
 *
 * GÜVENLİK: veritabanı adresi localhost/127.0.0.1 değilse ÇALIŞMAZ (canlıya asla dokunmaz).
 * Cron'lar otomatik başlamaz (CRON_ENABLED=0); yalnız betiğin çağırdığı anda çalışır.
 * Bildirim sağlayıcısı "console" (kimseye bildirim gitmez).
 *
 * Kullanım (apps/api):
 *   PROVA_DB='postgresql://postgres:paem@localhost:55432/paem' npx ts-node --transpile-only scripts/deneme-prova.ts
 *   ... --keep   → oluşturulan deneme/aday/oturumlar silinmez (panelde incelemek için)
 *   ... --soru 40 → deneme soru sayısı (varsayılan 40; ücretsiz 30 bariyerini de sınar)
 */
const DB = process.env.PROVA_DB ?? 'postgresql://postgres:paem@localhost:55432/paem';
{
  const host = new URL(DB).hostname;
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    console.error(`DURDU: prova yalnız yerel veritabanında çalışır (verilen: ${host}).`);
    process.exit(2);
  }
}
Object.assign(process.env, {
  DATABASE_URL: `${DB}${DB.includes('?') ? '&' : '?'}connection_limit=4`,
  DIRECT_URL: DB,
  CRON_ENABLED: '0',
  NOTIFICATIONS_PROVIDER: 'console',
  NOTIFICATIONS_WORKER: '0',
  EMAIL_WORKER: '0',
  NUDGE_CRON: '0',
  HUB_SYNC_ENABLED: '0',
});

const KEEP = process.argv.includes('--keep');
const SORU = Number(process.argv[process.argv.indexOf('--soru') + 1]) || 40;
const ETIKET = `PROVA ${new Date().toISOString().slice(0, 16)}`;

type Sonuc = { ad: string; ok: boolean; ayrinti: string };
const sonuclar: Sonuc[] = [];
const kontrol = (ad: string, ok: boolean, ayrinti = '') => {
  sonuclar.push({ ad, ok, ayrinti });
  console.log(`${ok ? '✓' : '✗'} ${ad}${ayrinti ? ` — ${ayrinti}` : ''}`);
};

async function main() {
  // Ortam ayarlandıktan SONRA yükle (Prisma ve Config modül yüklenirken env'i okur).
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../src/app.module');
  const { PrismaService } = await import('../src/infra/prisma/prisma.service');
  const { ExamsService } = await import('../src/modules/exams/exams.service');
  const { QuizService } = await import('../src/modules/quiz/quiz.service');
  const { ExamFinalizeJobService } = await import('../src/modules/quiz/exam-finalize-job.service');
  const { UserSyncService } = await import('../src/modules/auth/user-sync.service');
  const { CoachService } = await import('../src/modules/coach/coach.service');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const exams = app.get(ExamsService);
  const quiz = app.get(QuizService);
  const finalizer = app.get(ExamFinalizeJobService);
  const sync = app.get(UserSyncService);
  const coach = app.get(CoachService);

  const olusan = { examId: '', testExamId: '', userIds: [] as string[] };
  try {
    // ── Kurulum: soru seti ──────────────────────────────────────────────
    // Yalnız tek doğru şıkkı ve en az bir yanlış şıkkı olan yayındaki sorular.
    const adaylar = await prisma.question.findMany({
      where: { deletedAt: null, currentVersion: { status: 'published' } },
      select: {
        id: true,
        currentVersionId: true,
        currentVersion: { select: { options: { select: { id: true, isCorrect: true } } } },
      },
    });
    const dogruSik = new Map<string, { dogru: string; yanlis: string }>();
    const sorular: { id: string; currentVersionId: string | null }[] = [];
    for (const q of adaylar) {
      const ops = q.currentVersion?.options ?? [];
      const d = ops.filter((o) => o.isCorrect);
      const y = ops.find((o) => !o.isCorrect);
      if (d.length !== 1 || !y) continue;
      dogruSik.set(q.id, { dogru: d[0].id, yanlis: y.id });
      sorular.push(q);
      if (sorular.length === SORU) break;
    }
    if (sorular.length < SORU)
      throw new Error(`Yerel bankada uygun ${SORU} soru yok (${sorular.length}).`);

    // ── Kurulum: takvimli deneme, pencere şimdi açık, 20 dk ─────────────
    const now = Date.now();
    const exam = await prisma.exam.create({
      data: {
        title: ETIKET,
        description: 'Otomatik prova (scripts/deneme-prova.ts) — yerel veritabanı.',
        startAt: new Date(now - 60_000),
        durationMinutes: 20,
        publishMode: 'takvimli',
        endAt: new Date(now + 30 * 60_000),
        status: 'published',
        remindEnabled: false,
        questions: {
          create: sorular.map((q, i) => ({
            questionId: q.id,
            questionVersionId: q.currentVersionId!,
            sortOrder: i + 1,
          })),
        },
      },
    });
    olusan.examId = exam.id;
    await exams.buildQuestionPack(exam.id);

    // ── Kurulum: sanal adaylar (gerçek kayıt yolu: UserSyncService) ─────
    const aday = async (kod: string, premium = false) => {
      const id = crypto.randomUUID();
      const u = await sync.ensureUser({
        sub: id,
        email: `prova+${kod}-${id.slice(0, 6)}@example.invalid`,
        email_verified: true,
        user_metadata: { full_name: `Prova ${kod.toUpperCase()}` },
      } as never);
      olusan.userIds.push(id);
      if (premium) {
        await prisma.entitlement.update({
          where: { userId: id },
          data: { isPremium: true, validUntil: null },
        });
        return { ...u, isPremium: true };
      }
      return u;
    };
    const A = await aday('a', true); // hepsi doğru, teslim
    const B = await aday('b', true); // karışık, teslim
    const C = await aday('c', true); // cevaplar, teslim etmez → süre dolumu
    const D = await aday('d', true); // başlar, hiç cevap yok → süre dolumu
    const E = await aday('e', true); // B ile aynı net, daha çok yanlış → eşitlikte geride
    const F = await aday('f', false); // ücretsiz: 30 bariyeri

    const basla = async (u: typeof A) => {
      const r = (await exams.start(u, exam.id)) as {
        sessionId: string;
        questions: { questionId: string; versionId: string }[];
      };
      return r;
    };
    const cevapla = async (
      u: typeof A,
      sid: string,
      qid: string,
      vid: string,
      opt: string | null,
    ) =>
      quiz.submitAnswer(u, sid, {
        questionId: qid,
        questionVersionId: vid,
        selectedOptionId: opt ?? undefined,
        timeSpentMs: 20_000,
      } as never);

    // Beklenen net: doğru − yanlış/4 (Doc 18 karar 3).
    const net = (d: number, y: number) => Math.round((d - y / 4) * 100) / 100;

    // A — hepsi doğru
    const sa = await basla(A);
    kontrol(
      'Başlatma soruları paketten gelir',
      sa.questions.length === SORU,
      `${sa.questions.length}/${SORU}`,
    );
    const sa2 = await basla(A);
    kontrol(
      'İkinci başlatma aynı oturumu döndürür (çift oturum yok)',
      sa2.sessionId === sa.sessionId,
    );
    for (const q of sa.questions)
      await cevapla(A, sa.sessionId, q.questionId, q.versionId, dogruSik.get(q.questionId)!.dogru);
    const ra = (await quiz.completeSession(A.id, sa.sessionId, 'submitted')) as { score: number };
    kontrol(
      'A: tamamı doğru → net = soru sayısı',
      Number(ra.score) === SORU,
      `${ra.score} / beklenen ${SORU}`,
    );
    const ra2 = (await quiz.completeSession(A.id, sa.sessionId, 'submitted')) as { score: number };
    kontrol('A: ikinci teslim idempotent (puan değişmez)', Number(ra2.score) === Number(ra.score));

    // B — yarısı doğru, çeyreği yanlış, kalanı boş
    const sb = await basla(B);
    let bd = 0,
      by = 0;
    for (const [i, q] of sb.questions.entries()) {
      if (i < SORU / 2) {
        await cevapla(
          B,
          sb.sessionId,
          q.questionId,
          q.versionId,
          dogruSik.get(q.questionId)!.dogru,
        );
        bd++;
      } else if (i < (SORU * 3) / 4) {
        await cevapla(
          B,
          sb.sessionId,
          q.questionId,
          q.versionId,
          dogruSik.get(q.questionId)!.yanlis,
        );
        by++;
      }
    }
    const rb = (await quiz.completeSession(B.id, sb.sessionId, 'submitted')) as {
      score: number;
      correctCount: number;
      wrongCount: number;
      blankCount: number;
    };
    kontrol(
      'B: net = doğru − yanlış/4',
      Number(rb.score) === net(bd, by),
      `${rb.score} / beklenen ${net(bd, by)}`,
    );
    kontrol(
      'B: doğru/yanlış/boş sayıları',
      rb.correctCount === bd && rb.wrongCount === by && rb.blankCount === SORU - bd - by,
      `${rb.correctCount}/${rb.wrongCount}/${rb.blankCount}`,
    );

    // B — cevap değiştirme: son cevap geçerli (önce yanlış sonra doğru) ayrı adayla değil, C'de
    // C — 10 doğru, 2'sini önce yanlış sonra doğruya çevirir, teslim etmez
    const sc = await basla(C);
    for (const q of sc.questions.slice(0, 10))
      await cevapla(C, sc.sessionId, q.questionId, q.versionId, dogruSik.get(q.questionId)!.dogru);
    for (const q of sc.questions.slice(10, 12)) {
      await cevapla(C, sc.sessionId, q.questionId, q.versionId, dogruSik.get(q.questionId)!.yanlis);
      await cevapla(C, sc.sessionId, q.questionId, q.versionId, dogruSik.get(q.questionId)!.dogru);
    }

    // D — başlar, cevap yok
    const sd = await basla(D);

    // E — B ile aynı net ama farklı: 10 doğru + 0 yanlış (net 10) vs B? Eşitlik için B'nin netini yakala
    const se = await basla(E);
    // E: B ile aynı neti daha çok yanlışla üret (d - y/4 = bd - by/4) → d = bd + 1, y = by + 4
    const ed = Math.min(bd + 1, SORU),
      ey = Math.min(by + 4, SORU - ed);
    for (const [i, q] of se.questions.entries()) {
      if (i < ed)
        await cevapla(
          E,
          se.sessionId,
          q.questionId,
          q.versionId,
          dogruSik.get(q.questionId)!.dogru,
        );
      else if (i < ed + ey)
        await cevapla(
          E,
          se.sessionId,
          q.questionId,
          q.versionId,
          dogruSik.get(q.questionId)!.yanlis,
        );
    }
    await quiz.completeSession(E.id, se.sessionId, 'submitted');

    // F — ücretsiz aday: deneme cevapları kotaya takılmamalı (resmî deneme tamamı çözülebilir)
    const sf = await basla(F);
    let fHata: string | null = null;
    for (const q of sf.questions) {
      try {
        await cevapla(
          F,
          sf.sessionId,
          q.questionId,
          q.versionId,
          dogruSik.get(q.questionId)!.dogru,
        );
      } catch (e) {
        fHata = (e as Error).message;
        break;
      }
    }
    kontrol(
      'F (ücretsiz): denemenin bütün sorularını cevaplayabilir',
      fHata == null,
      fHata ?? `${SORU} cevap`,
    );
    const rf = (await quiz.completeSession(F.id, sf.sessionId, 'submitted')) as { score: number };
    kontrol('F: puanı doğru', Number(rf.score) === SORU, String(rf.score));

    // Dolgu adaylar: katılım RANKING_MIN_SAMPLE'a (10) ulaşsın, sıralama ekranı açık yolu da sınansın.
    for (let k = 1; k <= 5; k++) {
      const X = await aday(`x${k}`, true);
      const sx = await basla(X);
      for (const q of sx.questions.slice(0, k))
        await cevapla(
          X,
          sx.sessionId,
          q.questionId,
          q.versionId,
          dogruSik.get(q.questionId)!.dogru,
        );
      await quiz.completeSession(X.id, sx.sessionId, 'submitted');
    }

    // ── Süre dolumu (zaman yolculuğu): C ve D'nin bitiş anı geçmişe ──────
    await prisma.quizSession.updateMany({
      where: { id: { in: [sc.sessionId, sd.sessionId] } },
      data: { deadlineAt: new Date(Date.now() - 60_000) },
    });
    // Süre dolduktan sonra gelen cevap reddedilmeli
    let gecCevap = 'kabul edildi';
    try {
      await cevapla(
        C,
        sc.sessionId,
        sc.questions[20].questionId,
        sc.questions[20].versionId,
        dogruSik.get(sc.questions[20].questionId)!.dogru,
      );
    } catch (e) {
      gecCevap = `reddedildi (${(e as Error).message})`;
    }
    kontrol('Süre dolunca gelen cevap reddedilir', gecCevap.startsWith('reddedildi'), gecCevap);

    // Süresi DOLMAMIŞ oturum cron'da kapanmamalı (28 Eki hatası): G başlar, bitiş ileride
    const G = await aday('g', true);
    const sg = await basla(G);
    await exams.finalizeExpiredAttempts();
    await finalizer.drain(100);
    const oturum = (id: string) =>
      prisma.quizSession.findUniqueOrThrow({
        where: { id },
        select: {
          status: true,
          closedReason: true,
          score: true,
          correctCount: true,
          wrongCount: true,
        },
      });
    const og = await oturum(sg.sessionId);
    kontrol('Süresi dolmamış oturum cron’da AÇIK kalır', og.status === 'in_progress', og.status);
    const oc = await oturum(sc.sessionId);
    kontrol(
      'C: süre dolunca otomatik teslim (timeout)',
      oc.status === 'completed' && oc.closedReason === 'timeout',
      `${oc.status}/${oc.closedReason}`,
    );
    kontrol(
      'C: son cevap geçerli, net doğru',
      Number(oc.score) === net(12, 0),
      `${oc.score} / beklenen ${net(12, 0)}`,
    );
    const od = await oturum(sd.sessionId);
    kontrol(
      'D: boş oturum teslim edilir, net 0 (eksi değil)',
      od.status === 'completed' && Number(od.score) === 0,
      `${od.status} ${od.score}`,
    );
    await quiz.completeSession(G.id, sg.sessionId, 'submitted');

    // ── Pencere kapanışı → sıralama donar ───────────────────────────────
    await prisma.exam.update({
      where: { id: exam.id },
      data: { endAt: new Date(Date.now() - 60_000) },
    });
    await exams.closeWindows();
    const ex = await prisma.exam.findUniqueOrThrow({
      where: { id: exam.id },
      select: { rankingsComputedAt: true },
    });
    kontrol('Pencere kapanınca sıralama donar', ex.rankingsComputedAt != null);
    const sira = await prisma.examRanking.findMany({
      where: { examId: exam.id },
      orderBy: { rank: 'asc' },
      select: { userId: true, rank: true, score: true, wrongCount: true },
    });
    const siraOf = new Map(sira.map((r) => [r.userId, r]));
    kontrol(
      'Sıralama: A (tam puan) 1.',
      siraOf.get(A.id)?.rank === 1 || siraOf.get(F.id)?.rank === 1,
    );
    const rbS = siraOf.get(B.id),
      reS = siraOf.get(E.id);
    kontrol(
      'Eşitlik: aynı nette az yanlış önde (B, E’nin önünde)',
      !!rbS && !!reS && Number(rbS.score) === Number(reS.score) && rbS.rank < reS.rank,
      `B ${rbS?.score}/${rbS?.rank}. · E ${reS?.score}/${reS?.rank}.`,
    );
    const azalan = sira.every((r, i) => i === 0 || Number(sira[i - 1].score) >= Number(r.score));
    kontrol('Sıralama net’e göre azalan', azalan);

    // ── Ekranların okuduğu yüzeyler aynı sayıyı söyler ─────────────────
    const lb = (await exams.leaderboard(exam.id, {
      id: B.id,
      email: '',
      roles: ['user'],
      isPremium: true,
    })) as { participantCount: number; me: { rank: number } | null };
    const liste = (await exams.list({ id: B.id, email: '', roles: ['user'], isPremium: true })) as {
      id: string;
      my: { official: { rank: number | null; total: number } | null };
    }[];
    const kart = liste.find((x) => x.id === exam.id)?.my.official;
    kontrol(
      'Liste kartı ile sıralama ekranı aynı katılımcı sayısı',
      kart?.total === lb.participantCount,
      `kart ${kart?.total} · sıralama ${lb.participantCount}`,
    );
    kontrol(
      'Sıralama ekranı açık (≥10 resmî çözüm)',
      lb.me != null,
      `${lb.participantCount} katılımcı`,
    );
    kontrol(
      'Liste kartı ile sıralama ekranı aynı sıra',
      kart?.rank != null && kart?.rank === lb.me?.rank,
      `kart ${kart?.rank ?? '—'} · sıralama ${lb.me?.rank ?? '—'}`,
    );

    // ── Prova denemesi (testOnly): yalnız test hesaplarına görünür ──────
    const T = await aday('t', true);
    const betaRol = await prisma.role.findUniqueOrThrow({ where: { key: 'beta' } });
    await prisma.userRole.create({ data: { userId: T.id, roleId: betaRol.id } });
    const tester = { ...T, roles: [...T.roles, 'beta'] };
    const normal = { id: B.id, email: '', roles: ['user'], isPremium: true };
    const test = await prisma.exam.create({
      data: {
        title: `${ETIKET} · gizli`,
        startAt: new Date(Date.now() - 60_000),
        durationMinutes: 20,
        publishMode: 'serbest',
        status: 'published',
        testOnly: true,
        remindEnabled: false,
        questions: {
          create: sorular
            .slice(0, 10)
            .map((q, i) => ({
              questionId: q.id,
              questionVersionId: q.currentVersionId!,
              sortOrder: i + 1,
            })),
        },
      },
    });
    olusan.testExamId = test.id;
    await exams.buildQuestionPack(test.id);
    const gorur = async (u: typeof normal) =>
      ((await exams.list(u)) as { id: string }[]).some((x) => x.id === test.id);
    kontrol('Gizli deneme: normal kullanıcının listesinde YOK', !(await gorur(normal)));
    kontrol('Gizli deneme: test hesabının listesinde VAR', await gorur(tester));
    const reddeder = async (fn: () => Promise<unknown>) =>
      fn().then(
        () => false,
        () => true,
      );
    kontrol(
      'Gizli deneme: normal kullanıcı başlatamaz',
      await reddeder(() => exams.start(normal, test.id)),
    );
    kontrol(
      'Gizli deneme: normal kullanıcı sıralamasını göremez',
      await reddeder(() => exams.leaderboard(test.id, normal)),
    );
    kontrol(
      'Gizli deneme: anonim (web) sıralamasını göremez',
      await reddeder(() => exams.leaderboard(test.id)),
    );
    const st = (await exams.start(tester, test.id)) as {
      sessionId: string;
      questions: { questionId: string; versionId: string }[];
    };
    for (const q of st.questions)
      await cevapla(
        tester,
        st.sessionId,
        q.questionId,
        q.versionId,
        dogruSik.get(q.questionId)!.dogru,
      );
    const rt = (await quiz.completeSession(T.id, st.sessionId, 'submitted')) as { score: number };
    kontrol(
      'Gizli deneme: test hesabı çözer, puan doğru',
      Number(rt.score) === 10,
      String(rt.score),
    );
    const genel = (await exams.globalLeaderboard(normal)) as {
      top: { attempts: number; isMe: boolean }[];
    };
    const genelT = (await exams.globalLeaderboard(tester)) as { me: { attempts: number } | null };
    kontrol(
      'Gizli deneme genel liderliğe girmez',
      genelT.me == null,
      genelT.me ? `${genelT.me.attempts} çözüm sayıldı` : 'sayılmadı',
    );
    void genel;
    const bugun = JSON.stringify(await coach.brief(normal as never));
    kontrol('Gizli deneme normal kullanıcının Bugün ekranında YOK', !bugun.includes(test.id));
  } finally {
    for (const ex of KEEP ? [] : [olusan.testExamId].filter(Boolean)) {
      const sids = (
        await prisma.quizSession.findMany({ where: { examId: ex }, select: { id: true } })
      ).map((s) => s.id);
      await prisma.quizAnswer.deleteMany({ where: { sessionId: { in: sids } } });
      await prisma.quizSession.deleteMany({ where: { id: { in: sids } } });
      await prisma.exam.delete({ where: { id: ex } });
    }
    if (!KEEP && olusan.examId) {
      await prisma.examRanking.deleteMany({ where: { examId: olusan.examId } });
      const sids = (
        await prisma.quizSession.findMany({
          where: { examId: olusan.examId },
          select: { id: true },
        })
      ).map((s) => s.id);
      await prisma.examFinalizeJob
        .deleteMany({ where: { sessionId: { in: sids } } })
        .catch(() => {});
      await prisma.quizAnswer.deleteMany({ where: { sessionId: { in: sids } } });
      await prisma.quizSession.deleteMany({ where: { id: { in: sids } } });
      await prisma.exam.delete({ where: { id: olusan.examId } });
      await prisma
        .$executeRawUnsafe(`DELETE FROM users WHERE id = ANY($1::uuid[])`, olusan.userIds)
        .catch((e) => console.warn(`aday silinemedi (--keep gibi kalır): ${(e as Error).message}`));
    }
    await app.close();
  }

  const hata = sonuclar.filter((s) => !s.ok);
  console.log(
    `\n${sonuclar.length - hata.length}/${sonuclar.length} kontrol geçti${KEEP ? ' (veri bırakıldı: --keep)' : ''}.`,
  );
  process.exit(hata.length ? 1 : 0);
}

main().catch((e) => {
  console.error('PROVA ÇÖKTÜ:', e);
  process.exit(1);
});
