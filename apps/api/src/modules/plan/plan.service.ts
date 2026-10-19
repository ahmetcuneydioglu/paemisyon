import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Prisma, StudyPlanItemKind, StudyPlanItemStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { isEntitlementActive } from '../billing/entitlement.util';
import { hedefSinavTarihi } from '../coach/hedef-sinav';
import { haftaBasi } from '../../common/gun';
import {
  haftaEvresi,
  haftaKapanisiTasimasi,
  haftaOzeti,
  haftalikSureOnDegeri,
  haftalikSureyiNormalize,
  kalemBittiMi,
  planUret,
  type PlanDraft,
  type PlanPhase,
  type PlanTopicInput,
} from './plan.logic';

export { haftaBasi } from '../../common/gun';

/** Konu kalemi sayan tur modları; `review` tekrar kalemine, `exam`/`deneme` deneme kalemine gider. */
type KalemModu = 'practice' | 'daily' | 'review' | 'exam' | 'deneme';

export interface PlanItemView {
  id: string;
  kind: StudyPlanItemKind;
  topicId: string | null;
  topicName: string | null;
  courseName: string | null;
  targetMinutes: number;
  targetQuestions: number;
  doneMinutes: number;
  doneQuestions: number;
  remainingMinutes: number;
  status: StudyPlanItemStatus;
}

export interface PlanWeekView {
  weekStart: string;
  phase: PlanPhase;
  state: 'past' | 'current' | 'future';
  /** Ücretsiz planda gelecek haftalar kilitli: kalem listesi boş gelir (§6 karar 1). */
  locked: boolean;
  summary: ReturnType<typeof haftaOzeti>;
  itemCount: number;
  items: PlanItemView[];
}

export interface PlanView {
  id: string;
  examDate: string | null;
  examTypeId: string | null;
  weeklyMinutes: number;
  horizonWeeks: number;
  createdAt: string;
  revisedAt: string | null;
  currentWeekStart: string;
  phase: PlanPhase;
  /** Sınav geçtiyse (plan arşivlenmeyi bekliyor) ya da ufuk bittiyse true. */
  ended: boolean;
  coverage: PlanDraft['coverage'];
  thisWeek: PlanWeekView & {
    summary: ReturnType<typeof haftaOzeti> & { offPlanQuestions: number };
  };
  weeks: PlanWeekView[];
  /** Sıradaki kalem: bu haftanın en geride olan bitmemiş kalemi. */
  nextItem: PlanItemView | null;
  premiumLocked: boolean;
  suggestions: ('exam_date' | 'premium')[];
}

/** Koç brief'ine giren kompakt özet (CoachBrief.plan). */
export interface PlanBrief {
  exists: true;
  phase: PlanPhase;
  weekStart: string;
  summary: ReturnType<typeof haftaOzeti>;
  nextItem: {
    id: string;
    kind: StudyPlanItemKind;
    topicId: string | null;
    topicName: string | null;
    remainingMinutes: number;
  } | null;
  /** Bu haftanın kalemleri, kompakt (Bugün'deki vardiya listesi — Doc 49/13 F9-B). */
  items: {
    id: string;
    kind: StudyPlanItemKind;
    topicId: string | null;
    topicName: string | null;
    courseName: string | null;
    targetMinutes: number;
    doneMinutes: number;
    remainingMinutes: number;
    status: PlanItemView['status'];
  }[];
  ended: boolean;
}

const KALEM_SELECT = {
  id: true,
  weekStart: true,
  kind: true,
  topicId: true,
  topic: { select: { name: true, course: { select: { name: true } } } },
  targetQuestions: true,
  targetMinutes: true,
  doneQuestions: true,
  doneMinutes: true,
  status: true,
} satisfies Prisma.StudyPlanItemSelect;

type KalemSatiri = Prisma.StudyPlanItemGetPayload<{ select: typeof KALEM_SELECT }>;

/**
 * Haftalık plan (Doc 49/12 F8-A). Üretim `plan.logic.ts`'te saf; burada veri
 * toplama, kalıcılık, ilerleme kancaları ve haftalık revizyon cron'u.
 *
 * Kural sunucuda: evre, kilit, kapsam yüzdesi ve metinlerin dayandığı sayılar
 * buradan gider; istemci eşik bilmez (CLAUDE.md).
 */
@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);
  constructor(private readonly prisma: PrismaService) {}

  // ── Okuma ──

  async getPlan(
    userId: string,
    isPremium = false,
    now: Date = new Date(),
  ): Promise<{ plan: PlanView | null }> {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        examDate: true,
        examTypeId: true,
        weeklyMinutes: true,
        horizonWeeks: true,
        createdAt: true,
        revisedAt: true,
        items: {
          orderBy: [{ weekStart: 'asc' }, { targetMinutes: 'desc' }, { id: 'asc' }],
          select: KALEM_SELECT,
        },
      },
    });
    if (!plan) return { plan: null };

    const buHafta = haftaBasi(now);
    const buHaftaKey = tarih(buHafta);
    const haftaMap = new Map<string, KalemSatiri[]>();
    for (const i of plan.items) {
      const k = tarih(i.weekStart);
      if (!haftaMap.has(k)) haftaMap.set(k, []);
      haftaMap.get(k)!.push(i);
    }
    const haftaAnahtarlari = [...haftaMap.keys()].sort();
    const sonHafta = haftaAnahtarlari.at(-1) ?? buHaftaKey;
    const ended =
      (plan.examDate != null && plan.examDate.getTime() < buHafta.getTime()) ||
      sonHafta < buHaftaKey;

    const weeks: PlanWeekView[] = haftaAnahtarlari.map((k) => {
      const satirlar = haftaMap.get(k)!;
      const state: PlanWeekView['state'] =
        k < buHaftaKey ? 'past' : k === buHaftaKey ? 'current' : 'future';
      const locked = state === 'future' && !isPremium;
      return {
        weekStart: k,
        phase: haftaEvresi(new Date(`${k}T00:00:00.000Z`), plan.examDate),
        state,
        locked,
        summary: haftaOzeti(satirlar),
        itemCount: satirlar.length,
        items: locked ? [] : satirlar.map(kalemGorunumu),
      };
    });

    const buHaftaSatirlari = haftaMap.get(buHaftaKey) ?? [];
    const [offPlan, coverage] = await Promise.all([
      this.planDisiSoru(userId, buHafta, buHaftaSatirlari),
      this.kapsam(plan.examTypeId, plan.items),
    ]);
    const thisWeekItems = buHaftaSatirlari.map(kalemGorunumu);
    const thisWeek: PlanView['thisWeek'] = {
      weekStart: buHaftaKey,
      phase: haftaEvresi(buHafta, plan.examDate),
      state: 'current',
      locked: false,
      summary: { ...haftaOzeti(buHaftaSatirlari), offPlanQuestions: offPlan },
      itemCount: thisWeekItems.length,
      items: thisWeekItems,
    };
    const nextItem = siradakiKalem(thisWeekItems);
    const suggestions: PlanView['suggestions'] = [];
    if (!plan.examDate) suggestions.push('exam_date');
    if (!isPremium) suggestions.push('premium');

    return {
      plan: {
        id: plan.id,
        examDate: plan.examDate ? tarih(plan.examDate) : null,
        examTypeId: plan.examTypeId,
        weeklyMinutes: plan.weeklyMinutes,
        horizonWeeks: plan.horizonWeeks,
        createdAt: plan.createdAt.toISOString(),
        revisedAt: plan.revisedAt?.toISOString() ?? null,
        currentWeekStart: buHaftaKey,
        phase: thisWeek.phase,
        ended,
        coverage,
        thisWeek,
        weeks,
        nextItem,
        premiumLocked: !isPremium,
        suggestions,
      },
    };
  }

  /** Koç brief'i için kompakt özet; plan yoksa null. Tek sorgu (bu haftanın kalemleri). */
  async ozet(userId: string, now: Date = new Date()): Promise<PlanBrief | null> {
    const buHafta = haftaBasi(now);
    const plan = await this.prisma.studyPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: {
        examDate: true,
        items: {
          where: { weekStart: buHafta },
          orderBy: [{ targetMinutes: 'desc' }, { id: 'asc' }],
          select: KALEM_SELECT,
        },
        _count: { select: { items: { where: { weekStart: { gte: buHafta } } } } },
      },
    });
    if (!plan) return null;
    const items = plan.items.map(kalemGorunumu);
    const next = siradakiKalem(items);
    return {
      exists: true,
      phase: haftaEvresi(buHafta, plan.examDate),
      weekStart: tarih(buHafta),
      summary: haftaOzeti(plan.items),
      nextItem: next
        ? {
            id: next.id,
            kind: next.kind,
            topicId: next.topicId,
            topicName: next.topicName,
            remainingMinutes: next.remainingMinutes,
          }
        : null,
      items: items.map((i) => ({
        id: i.id,
        kind: i.kind,
        topicId: i.topicId,
        topicName: i.topicName,
        courseName: i.courseName,
        targetMinutes: i.targetMinutes,
        doneMinutes: i.doneMinutes,
        remainingMinutes: i.remainingMinutes,
        status: i.status,
      })),
      ended:
        (plan.examDate != null && plan.examDate.getTime() < buHafta.getTime()) ||
        plan._count.items === 0,
    };
  }

  /** Plan kurma ekranının ön değerleri (süre önerisi, tarih, sınav türü). */
  async onDegerler(userId: string, now: Date = new Date()) {
    const u = await this.kullanici(userId);
    const hedef = hedefSinavTarihi(u.targetExamDate, u.preferredModule?.examDate ?? null, now);
    return {
      examTypeId: u.preferredModuleId,
      examTypeName: u.preferredModule?.name ?? null,
      examDate: hedef.date ? tarih(hedef.date) : null,
      examDateSource: hedef.source,
      suggestedWeeklyMinutes: haftalikSureOnDegeri(u.dailyMinutes, u.dailyGoal),
      dailyMinutes: u.dailyMinutes,
    };
  }

  // ── Kurma / revizyon / arşiv ──

  async createPlan(
    user: AuthenticatedUser,
    dto: { weeklyMinutes?: number; examDate?: string | null },
    now: Date = new Date(),
  ) {
    const u = await this.kullanici(user.id);
    if (!u.preferredModuleId) {
      throw new BadRequestException({
        code: 'EXAM_TYPE_REQUIRED',
        message: 'Önce hedef sınavını seç.',
      });
    }
    const examDate = await this.sinavTarihiniCoz(user.id, u, dto.examDate, now);
    const weeklyMinutes = haftalikSureyiNormalize(
      dto.weeklyMinutes ?? haftalikSureOnDegeri(u.dailyMinutes, u.dailyGoal),
    );
    const startWeek = haftaBasi(now);
    const draft = await this.taslakUret(user.id, u.preferredModuleId, {
      startWeek,
      examDate,
      weeklyMinutes,
      isPremium: user.isPremium,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.studyPlan.updateMany({
        where: { userId: user.id, status: 'active' },
        data: { status: 'archived' },
      });
      const plan = await tx.studyPlan.create({
        data: {
          userId: user.id,
          examDate,
          examTypeId: u.preferredModuleId,
          weeklyMinutes,
          horizonWeeks: draft.weeks.length,
        },
        select: { id: true },
      });
      await tx.studyPlanItem.createMany({ data: kalemSatirlari(plan.id, draft) });
    });
    return this.getPlan(user.id, user.isPremium, now);
  }

  /** Gelecek haftaları yeniden üretir; geçmiş ve bu haftanın kalemleri korunur. */
  async revisePlan(
    user: AuthenticatedUser,
    dto: { weeklyMinutes?: number; examDate?: string | null },
    now: Date = new Date(),
  ) {
    const plan = await this.aktifPlan(user.id);
    const u = await this.kullanici(user.id);
    const examDate =
      dto.examDate !== undefined
        ? await this.sinavTarihiniCoz(user.id, u, dto.examDate, now)
        : plan.examDate;
    const weeklyMinutes =
      dto.weeklyMinutes != null ? haftalikSureyiNormalize(dto.weeklyMinutes) : plan.weeklyMinutes;
    await this.gelecegiYenidenUret(plan.id, user.id, plan.examTypeId ?? u.preferredModuleId, {
      examDate,
      weeklyMinutes,
      isPremium: user.isPremium,
      now,
      /** Bu hafta da yeniden kurulsun: kullanıcı süreyi değiştirdiyse bu haftayı da etkilesin. */
      buHaftaDahil: true,
    });
    await this.prisma.studyPlan.update({
      where: { id: plan.id },
      data: { examDate, weeklyMinutes, revisedAt: now },
    });
    return this.getPlan(user.id, user.isPremium, now);
  }

  async archivePlan(userId: string) {
    const r = await this.prisma.studyPlan.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'archived' },
    });
    return { archived: r.count > 0 };
  }

  // ── İlerleme kancaları (en iyi çaba; çağıran `void` ile kullanır) ──

  /**
   * Cevap kancası: tur moduna göre kalem seçilir — practice/daily → konu kalemi,
   * review → tekrar kalemi (yoksa konu kalemi), exam/deneme → deneme kalemi.
   * `yeniSoru` false ise (yeniden cevap) soru sayacı artmaz, süre eklenir.
   */
  async cevapKaydet(
    userId: string,
    mode: KalemModu,
    topicId: string | null,
    saniye: number,
    yeniSoru: boolean,
    now: Date = new Date(),
  ): Promise<void> {
    try {
      const kalem = await this.haftaninKalemi(userId, mode, topicId, now);
      if (!kalem) return;
      await this.ilerlemeYaz(kalem, Math.max(0, Math.round(saniye)), yeniSoru ? 1 : 0);
    } catch (e) {
      this.logger.warn(`plan ilerlemesi yazılamadı: ${e instanceof Error ? e.message : e}`);
    }
  }

  /** Okuyucu kancası: kanunun bağlı konusu bu haftanın kaleminde ise süre eklenir. */
  async okumaKaydet(
    userId: string,
    legislationId: string,
    saniye: number,
    now: Date = new Date(),
  ): Promise<void> {
    if (saniye <= 0) return;
    try {
      const leg = await this.prisma.legislation.findUnique({
        where: { id: legislationId },
        select: { topicId: true },
      });
      if (!leg?.topicId) return;
      const kalem = await this.haftaninKalemi(userId, 'practice', leg.topicId, now);
      if (!kalem) return;
      await this.ilerlemeYaz(kalem, Math.round(saniye), 0);
    } catch (e) {
      this.logger.warn(`plan okuma ilerlemesi yazılamadı: ${e instanceof Error ? e.message : e}`);
    }
  }

  // ── Haftalık revizyon ──

  /**
   * Pazartesi 04:40 TR — uygulama haftası 04:00'te döndükten ve haftalık mastery
   * fotoğrafı (04:30) çekildikten sonra: geçen haftayı kapatır, premium planların
   * gelecek haftalarını taze mastery ile yeniden üretir, sınavı geçen planları
   * arşivler. Pooler kuralı: tek işlem, plan başına sıralı.
   */
  @Cron('40 4 * * 1', { timeZone: 'Europe/Istanbul' })
  async haftalikRevizyonCron() {
    try {
      const r = await this.haftalikRevizyon();
      this.logger.log(`haftalık plan revizyonu: ${JSON.stringify(r)}`);
    } catch (e) {
      this.logger.error(`haftalık plan revizyonu düştü: ${e instanceof Error ? e.message : e}`);
    }
  }

  async haftalikRevizyon(now: Date = new Date()) {
    const buHafta = haftaBasi(now);
    const planlar = await this.prisma.studyPlan.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        userId: true,
        examDate: true,
        examTypeId: true,
        weeklyMinutes: true,
        user: {
          select: { status: true, entitlement: { select: { isPremium: true, validUntil: true } } },
        },
      },
    });
    const sonuc = { kapanan: 0, yenilenen: 0, arsivlenen: 0 };
    for (const p of planlar) {
      // Hesap silinmişse (KVKK: satır anonimleşir, silinmez) ya da sınav geçtiyse plan biter.
      if (p.user.status === 'deleted' || (p.examDate && p.examDate.getTime() < buHafta.getTime())) {
        await this.prisma.studyPlan.update({ where: { id: p.id }, data: { status: 'archived' } });
        sonuc.arsivlenen++;
        continue;
      }
      const isPremium = isEntitlementActive(p.user.entitlement, now);
      const gecmis = await this.prisma.studyPlanItem.findMany({
        where: { planId: p.id, weekStart: { lt: buHafta }, status: 'pending' },
        select: {
          id: true,
          kind: true,
          topicId: true,
          targetMinutes: true,
          targetQuestions: true,
          doneMinutes: true,
          doneQuestions: true,
        },
      });
      if (gecmis.length) {
        const bitenler = gecmis.filter(kalemBittiMi).map((k) => k.id);
        const kalanlar = gecmis.filter((k) => !kalemBittiMi(k)).map((k) => k.id);
        if (bitenler.length)
          await this.prisma.studyPlanItem.updateMany({
            where: { id: { in: bitenler } },
            data: { status: 'done' },
          });
        if (kalanlar.length)
          await this.prisma.studyPlanItem.updateMany({
            where: { id: { in: kalanlar } },
            data: { status: 'skipped' },
          });
        sonuc.kapanan += gecmis.length;
      }
      if (!isPremium || !p.examTypeId) continue; // ücretsizde otomatik revizyon yok (§6 karar 1)
      const carryOver = haftaKapanisiTasimasi(gecmis, true);
      await this.gelecegiYenidenUret(p.id, p.userId, p.examTypeId, {
        examDate: p.examDate,
        weeklyMinutes: p.weeklyMinutes,
        isPremium,
        now,
        buHaftaDahil: true,
        carryOver,
      });
      await this.prisma.studyPlan.update({ where: { id: p.id }, data: { revisedAt: now } });
      sonuc.yenilenen++;
    }
    return sonuc;
  }

  // ── Yardımcılar ──

  private async aktifPlan(userId: string) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, examDate: true, examTypeId: true, weeklyMinutes: true },
    });
    if (!plan) throw new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'Aktif plan yok.' });
    return plan;
  }

  private kullanici(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        dailyGoal: true,
        dailyMinutes: true,
        targetExamDate: true,
        preferredModuleId: true,
        preferredModule: { select: { name: true, examDate: true } },
      },
    });
  }

  /** dto.examDate: undefined → mevcut hedef; null → tarih yok; "YYYY-MM-DD" → yaz ve kullan. */
  private async sinavTarihiniCoz(
    userId: string,
    u: { targetExamDate: Date | null; preferredModule: { examDate: Date | null } | null },
    dtoDate: string | null | undefined,
    now: Date,
  ): Promise<Date | null> {
    if (dtoDate === undefined)
      return hedefSinavTarihi(u.targetExamDate, u.preferredModule?.examDate ?? null, now).date;
    if (dtoDate === null) {
      // Kişisel tarih kaldırılır; resmî tarih varsa plan ona göre kurulur.
      await this.prisma.user.update({ where: { id: userId }, data: { targetExamDate: null } });
      return u.preferredModule?.examDate ?? null;
    }
    const d = new Date(`${dtoDate}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Geçersiz sınav tarihi.');
    if (d.getTime() < haftaBasi(now).getTime())
      throw new BadRequestException('Sınav tarihi geçmişte olamaz.');
    // Tek kaynak: geri sayım ve koç da bu tarihi okur.
    await this.prisma.user.update({ where: { id: userId }, data: { targetExamDate: d } });
    return d;
  }

  /** Müfredat (bölüm → ders → konu, yayımlı soru sayısıyla) + kullanıcı durumu → üretim girdisi. */
  private async taslakUret(
    userId: string,
    examTypeId: string,
    opts: {
      startWeek: Date;
      examDate: Date | null;
      weeklyMinutes: number;
      isPremium: boolean;
      carryOver?: Map<string, number>;
    },
  ): Promise<PlanDraft> {
    const topics = await this.mufredat(examTypeId);
    const ids = topics.map((t) => t.topicId);
    const [progress, wrongs, avg] = await Promise.all([
      this.prisma.userTopicProgress.findMany({
        where: { userId, topicId: { in: ids } },
        select: { topicId: true, solvedCount: true, correctCount: true, mastery: true },
      }),
      this.prisma.wrongAnswer
        .findMany({ where: { userId, resolvedAt: null }, select: { questionId: true } })
        .then((ws) =>
          ws.length
            ? this.prisma.question.findMany({
                where: { id: { in: ws.map((w) => w.questionId) } },
                select: { topicId: true },
              })
            : [],
        ),
      this.prisma.quizAnswer.aggregate({
        where: { session: { userId }, timeSpentMs: { gt: 0, lt: 600_000 } },
        _avg: { timeSpentMs: true },
      }),
    ]);
    const prog = new Map(progress.map((p) => [p.topicId, p]));
    const yanlis = new Map<string, number>();
    for (const w of wrongs) yanlis.set(w.topicId, (yanlis.get(w.topicId) ?? 0) + 1);
    const girdi: PlanTopicInput[] = topics.map((t) => {
      const p = prog.get(t.topicId);
      return {
        ...t,
        solved: p?.solvedCount ?? 0,
        correct: p?.correctCount ?? 0,
        mastery: p ? Number(p.mastery) : 0,
        wrongCount: yanlis.get(t.topicId) ?? 0,
      };
    });
    const avgMs = avg._avg.timeSpentMs;
    return planUret({
      startWeek: opts.startWeek,
      examDate: opts.examDate,
      weeklyMinutes: opts.weeklyMinutes,
      topics: girdi,
      isPremium: opts.isPremium,
      avgAnswerSeconds: avgMs ? avgMs / 1000 : null,
      carryOver: opts.carryOver,
    });
  }

  /** Sınav türünün konuları: bölüm ağırlığı + yayımlı soru sayısı (silinmiş ders/konu hariç). */
  private async mufredat(
    examTypeId: string,
  ): Promise<Omit<PlanTopicInput, 'solved' | 'correct' | 'mastery' | 'wrongCount'>[]> {
    const sections = await this.prisma.examSection.findMany({
      where: { examTypeId, deletedAt: null },
      select: {
        id: true,
        weightPercent: true,
        courses: {
          select: {
            course: {
              select: {
                deletedAt: true,
                topics: {
                  where: { deletedAt: null },
                  select: {
                    id: true,
                    name: true,
                    _count: {
                      select: {
                        questions: { where: { deletedAt: null, currentVersionId: { not: null } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const out: Omit<PlanTopicInput, 'solved' | 'correct' | 'mastery' | 'wrongCount'>[] = [];
    const seen = new Set<string>();
    for (const s of sections) {
      for (const c of s.courses) {
        if (c.course.deletedAt) continue;
        for (const t of c.course.topics) {
          if (seen.has(t.id)) continue; // bir konu iki bölümde: ilk (ağır) bölümde kalır
          seen.add(t.id);
          out.push({
            topicId: t.id,
            name: t.name,
            sectionId: s.id,
            sectionWeight: s.weightPercent,
            publishedQuestions: t._count.questions,
          });
        }
      }
    }
    return out;
  }

  private async gelecegiYenidenUret(
    planId: string,
    userId: string,
    examTypeId: string | null,
    opts: {
      examDate: Date | null;
      weeklyMinutes: number;
      isPremium: boolean;
      now: Date;
      buHaftaDahil: boolean;
      carryOver?: Map<string, number>;
    },
  ) {
    if (!examTypeId) return;
    const buHafta = haftaBasi(opts.now);
    const baslangic = opts.buHaftaDahil ? buHafta : new Date(buHafta.getTime() + 7 * 86_400_000);
    // Bu haftanın yazılmış ilerlemesi korunur: aynı konunun yeni kalemi eski sayaçları devralır.
    const eski = await this.prisma.studyPlanItem.findMany({
      where: { planId, weekStart: { gte: baslangic } },
      select: {
        weekStart: true,
        kind: true,
        topicId: true,
        doneMinutes: true,
        doneSeconds: true,
        doneQuestions: true,
      },
    });
    const devir = new Map<
      string,
      { doneMinutes: number; doneSeconds: number; doneQuestions: number }
    >();
    for (const e of eski) {
      if (tarih(e.weekStart) !== tarih(buHafta)) continue;
      devir.set(`${e.kind}:${e.topicId ?? ''}`, {
        doneMinutes: e.doneMinutes,
        doneSeconds: e.doneSeconds,
        doneQuestions: e.doneQuestions,
      });
    }
    const draft = await this.taslakUret(userId, examTypeId, {
      startWeek: baslangic,
      examDate: opts.examDate,
      weeklyMinutes: opts.weeklyMinutes,
      isPremium: opts.isPremium,
      carryOver: opts.carryOver,
    });
    const satirlar = kalemSatirlari(planId, draft).map((s) => {
      const d =
        tarih(s.weekStart) === tarih(buHafta)
          ? devir.get(`${s.kind}:${s.topicId ?? ''}`)
          : undefined;
      if (!d) return s;
      const birlesik = { ...s, ...d };
      return {
        ...birlesik,
        status: kalemBittiMi(birlesik) ? ('done' as const) : ('pending' as const),
      };
    });
    await this.prisma.$transaction([
      this.prisma.studyPlanItem.deleteMany({ where: { planId, weekStart: { gte: baslangic } } }),
      this.prisma.studyPlanItem.createMany({ data: satirlar }),
      this.prisma.studyPlan.update({
        where: { id: planId },
        data: { horizonWeeks: draft.weeks.length },
      }),
    ]);
  }

  private async haftaninKalemi(userId: string, mode: KalemModu, topicId: string | null, now: Date) {
    const buHafta = haftaBasi(now);
    const kind: StudyPlanItemKind =
      mode === 'exam' || mode === 'deneme' ? 'mock' : mode === 'review' ? 'review' : 'topic';
    const ortak = {
      plan: { userId, status: 'active' as const },
      weekStart: buHafta,
      status: { in: ['pending', 'done'] as StudyPlanItemStatus[] },
    };
    const sec = { id: true, targetMinutes: true, targetQuestions: true } as const;
    if (kind !== 'topic') {
      const k = await this.prisma.studyPlanItem.findFirst({
        where: { ...ortak, kind },
        select: sec,
      });
      if (k || kind === 'mock' || !topicId) return k;
    }
    if (!topicId) return null;
    return this.prisma.studyPlanItem.findFirst({
      where: { ...ortak, kind: 'topic', topicId },
      select: sec,
    });
  }

  /** Atomik sayaç artışı; dakika türetilir; hedefe ulaşınca `done`. */
  private async ilerlemeYaz(kalem: { id: string }, saniye: number, soru: number) {
    if (saniye <= 0 && soru <= 0) return;
    await this.prisma.$executeRaw`
      UPDATE study_plan_items
      SET done_seconds = done_seconds + ${saniye},
          done_minutes = (done_seconds + ${saniye}) / 60,
          done_questions = done_questions + ${soru},
          status = CASE
            WHEN status = 'skipped' THEN status
            WHEN (target_questions > 0 AND done_questions + ${soru} >= target_questions)
              OR (target_minutes > 0 AND (done_seconds + ${saniye}) / 60 >= target_minutes)
            THEN 'done'::"StudyPlanItemStatus"
            ELSE status END
      WHERE id = ${kalem.id}::uuid`;
  }

  /** Bu hafta kotaya tabi modlarda verilen cevap sayısı − plan kalemlerine yazılan. */
  private async planDisiSoru(userId: string, buHafta: Date, satirlar: KalemSatiri[]) {
    const toplam = await this.prisma.quizAnswer.count({
      where: {
        session: { userId, mode: { in: ['practice', 'daily', 'review'] } },
        answeredAt: { gte: buHafta },
      },
    });
    const planda = satirlar
      .filter((s) => s.kind !== 'mock')
      .reduce((a, s) => a + s.doneQuestions, 0);
    return Math.max(0, toplam - planda);
  }

  private async kapsam(
    examTypeId: string | null,
    items: { topicId: string | null }[],
  ): Promise<PlanDraft['coverage']> {
    const topics = new Set(items.map((i) => i.topicId).filter((x): x is string => !!x)).size;
    if (!examTypeId) return { topics, syllabusTopics: 0, pctOfSyllabus: 0 };
    const mufredat = await this.mufredat(examTypeId);
    const syllabusTopics = mufredat.filter((t) => t.publishedQuestions > 0).length;
    return {
      topics,
      syllabusTopics,
      pctOfSyllabus: syllabusTopics > 0 ? Math.round((topics / syllabusTopics) * 100) : 0,
    };
  }
}

function kalemSatirlari(planId: string, draft: PlanDraft) {
  return draft.weeks.flatMap((w) =>
    w.items.map((i) => ({
      planId,
      weekStart: w.weekStart,
      kind: i.kind,
      topicId: i.topicId,
      targetMinutes: i.targetMinutes,
      targetQuestions: i.targetQuestions,
    })),
  );
}

function kalemGorunumu(i: KalemSatiri): PlanItemView {
  return {
    id: i.id,
    kind: i.kind,
    topicId: i.topicId,
    topicName: i.topic?.name ?? null,
    courseName: i.topic?.course.name ?? null,
    targetMinutes: i.targetMinutes,
    targetQuestions: i.targetQuestions,
    doneMinutes: i.doneMinutes,
    doneQuestions: i.doneQuestions,
    remainingMinutes: Math.max(0, i.targetMinutes - i.doneMinutes),
    status: i.status,
  };
}

/**
 * Bu haftanın sıradaki kalemi (P-D kararı, 18 Eki 2026): başlanmış ama bitmemiş
 * kalem varsa o önce gelir — ilerlemesi en yüksek olanı (başladığını bitir);
 * hiçbiri başlanmamışsa oransal olarak en geride olan (büyük hedef önce).
 */
function siradakiKalem(items: PlanItemView[]): PlanItemView | null {
  const acik = items.filter((i) => i.status === 'pending' && i.remainingMinutes > 0);
  if (!acik.length) return null;
  const oran = (i: PlanItemView) => (i.targetMinutes ? i.doneMinutes / i.targetMinutes : 1);
  const baslanmis = acik.filter((i) => i.doneMinutes > 0 || i.doneQuestions > 0);
  if (baslanmis.length)
    return [...baslanmis].sort((a, b) => oran(b) - oran(a) || b.targetMinutes - a.targetMinutes)[0];
  return [...acik].sort((a, b) => oran(a) - oran(b) || b.targetMinutes - a.targetMinutes)[0];
}

function tarih(d: Date): string {
  return d.toISOString().slice(0, 10);
}
