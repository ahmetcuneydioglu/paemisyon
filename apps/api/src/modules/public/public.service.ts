import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import { dailyQuestionPoolWhere, pickDailyIds } from '../../common/daily-select.logic';
import { FREE_DAILY_LIMIT_FALLBACK } from '../../common/plan.constants';

/** Pazarlama sayfalarının tükettiği fiyat bilgisi (kimlik gerektirmez). */
export interface PublicPricing {
  /** Ücretsiz katmanın günlük soru hakkı — metinler bu sayıyı gömmez, buradan okur. */
  freeDailyLimit: number;
  plans: { key: string; name: string; price: string; currency: string; period: string }[];
}

/** TR-duyarlı URL slug'ı: "2559 Sayılı Polis Vazife..." → "2559-sayili-polis-vazife..." */
export function slugify(s: string): string {
  const map: Record<string, string> = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'c',
    Ğ: 'g',
    İ: 'i',
    I: 'i',
    Ö: 'o',
    Ş: 's',
    Ü: 'u',
    â: 'a',
    Â: 'a',
    î: 'i',
    û: 'u',
  };
  return s
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Kanun/yönetmelik sayfası sayılacak konu adı deseni (Doc 23 SEO katmanı). */
const LAW_NAME_RE = /sayılı|kanun|yönetmeli|khk|mevzuat/i;

/**
 * Public (auth'suz) içerik uçları — paemisyon.com SEO katmanı (Doc 23).
 * KURAL: cevap anahtarı yalnız bilinçli, SINIRLI istisnalarla dışarı çıkar:
 * (1) günün sorusu reveal'ı (tek soru, funnel), (2) kanun sayfası örnek sorusu
 * (SEO için tam içerik — sabit tek soru), (3) günün quizi reveal'ı (yalnız bugünkü
 * 10 deterministik soru, tek-tek, throttle'lı funnel). Banka geneli asla sızmaz.
 */
@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  // ── Günün Sorusu ──────────────────────────────────────────────
  // Tarih tohumlu deterministik: herkes aynı soruyu görür (paylaşılabilir).
  // Sonuç gün boyunca sabit olduğundan tüm-banka taramasını günde bir kez öder
  // (Railway kalıcı süreç → in-memory memo istekler arası yaşar).
  private qotdCache: { key: string; id: string } | null = null;
  private async questionOfDayId(): Promise<string> {
    const dateKey = new Date().toISOString().slice(0, 10) + ':qotd';
    if (this.qotdCache?.key === dateKey) return this.qotdCache.id;
    const pool = await this.prisma.question.findMany({
      where: {
        deletedAt: null,
        currentVersionId: { not: null },
        topic: {
          deletedAt: null,
          isPremium: false,
          course: { deletedAt: null, sections: { some: { section: { deletedAt: null } } } },
        },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    if (pool.length === 0) throw new NotFoundException('Yayında soru yok.');
    let h = 0;
    for (const c of dateKey) h = (h * 31 + c.charCodeAt(0)) | 0;
    const id = pool[Math.abs(h) % pool.length].id;
    this.qotdCache = { key: dateKey, id };
    return id;
  }

  async questionOfDay() {
    const id = await this.questionOfDayId();
    const q = await this.prisma.question.findUniqueOrThrow({
      where: { id },
      select: {
        currentVersion: {
          select: {
            id: true,
            stem: true,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, text: true }, // doğru cevap YOK
            },
          },
        },
        topic: { select: { name: true, course: { select: { name: true } } } },
      },
    });
    return {
      date: new Date().toISOString().slice(0, 10),
      topic: `${q.topic.course.name} / ${q.topic.name}`,
      versionId: q.currentVersion!.id,
      stem: q.currentVersion!.stem,
      options: q.currentVersion!.options,
    };
  }

  /** Seçim sonrası açıklama — yalnız GÜNÜN sorusu için (funnel istisnası). */
  async revealQuestionOfDay(versionId: string, optionId: string) {
    const todayId = await this.questionOfDayId();
    const version = await this.prisma.questionVersion.findFirst({
      where: { id: versionId, questionId: todayId }, // yalnız bugünkü soru açılabilir
      select: {
        explanation: true,
        sourceLabel: true,
        options: { select: { id: true, isCorrect: true } },
      },
    });
    if (!version) throw new BadRequestException('Geçersiz soru.');
    const chosen = version.options.find((o) => o.id === optionId);
    if (!chosen) throw new BadRequestException('Geçersiz şık.');
    const showSource = await this.settings.getBool(SETTING_KEYS.showQuestionSource, true);
    return {
      isCorrect: chosen.isCorrect,
      correctOptionId: version.options.find((o) => o.isCorrect)?.id ?? null,
      explanation: version.explanation,
      source: showSource ? version.sourceLabel : null,
    };
  }

  // ── Günün Quizi (girişsiz funnel) ─────────────────────────────
  // Girişli `daily` seansıyla AYNI 10 gün-tohumlu soru (common/daily-select.logic).
  // Liste cevapsız; cevap tek-tek revealDailyQuiz ile (yalnız bugünün 10'u).
  private dailyQuizCache: { key: string; ids: string[] } | null = null;
  private async dailyQuizIds(): Promise<string[]> {
    const dateKey = new Date().toISOString().slice(0, 10);
    if (this.dailyQuizCache?.key === dateKey) return this.dailyQuizCache.ids;
    const pool = await this.prisma.question.findMany({
      where: dailyQuestionPoolWhere(),
      select: { id: true, currentVersionId: true },
      orderBy: { id: 'asc' },
    });
    if (pool.length === 0) throw new NotFoundException('Günün quizi için yayında soru yok.');
    const ids = pickDailyIds(pool, dateKey).map((q) => q.id);
    this.dailyQuizCache = { key: dateKey, ids };
    return ids;
  }

  async dailyQuiz() {
    const ids = await this.dailyQuizIds();
    const questions = await this.prisma.question.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        currentVersion: {
          select: {
            id: true,
            stem: true,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, text: true }, // doğru cevap YOK
            },
          },
        },
        topic: { select: { name: true, course: { select: { name: true } } } },
      },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));
    // Deterministik sırayı koru (ids sırası).
    const ordered = ids.map((id) => byId.get(id)).filter((q) => q != null);
    return {
      date: new Date().toISOString().slice(0, 10),
      count: ordered.length,
      questions: ordered.map((q) => ({
        questionId: q!.id,
        versionId: q!.currentVersion!.id,
        stem: q!.currentVersion!.stem,
        topic: `${q!.topic.course.name} / ${q!.topic.name}`,
        options: q!.currentVersion!.options,
      })),
    };
  }

  /** Cevap — yalnız bugünün 10 quiz sorusundan biri için (funnel istisnası). */
  async revealDailyQuiz(versionId: string, optionId: string) {
    const ids = await this.dailyQuizIds();
    const version = await this.prisma.questionVersion.findFirst({
      where: { id: versionId, questionId: { in: ids } }, // yalnız bugünün 10'u
      select: {
        explanation: true,
        sourceLabel: true,
        options: { select: { id: true, isCorrect: true } },
      },
    });
    if (!version) throw new BadRequestException('Geçersiz soru.');
    const chosen = version.options.find((o) => o.id === optionId);
    if (!chosen) throw new BadRequestException('Geçersiz şık.');
    const showSource = await this.settings.getBool(SETTING_KEYS.showQuestionSource, true);
    return {
      isCorrect: chosen.isCorrect,
      correctOptionId: version.options.find((o) => o.isCorrect)?.id ?? null,
      explanation: version.explanation,
      source: showSource ? version.sourceLabel : null,
    };
  }

  // ── Fiyatlandırma (girişsiz funnel) ───────────────────────────
  // Fiyat ve ücretsiz limit TEK KAYNAKTAN (plans tablosu) gelir; pazarlama
  // metinleri sayıyı hardcode etmez (Doc 27: kural sunucuda yaşar). Girişsiz
  // ziyaretçi de görmeli — /billing/plans kimlik istediği için burada açılır.
  // Satın alma linki YOK: ödeme Telegram/Instagram üzerinden manuel yürür.
  private pricingCache: { data: PublicPricing; expiresAt: number } | null = null;

  async pricing(): Promise<PublicPricing> {
    if (this.pricingCache && this.pricingCache.expiresAt > Date.now()) {
      return this.pricingCache.data;
    }
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: {
        key: true,
        name: true,
        price: true,
        currency: true,
        period: true,
        dailyQuestionLimit: true,
      },
    });
    const free = plans.find((p) => p.key === 'free');
    const data: PublicPricing = {
      freeDailyLimit: free?.dailyQuestionLimit ?? FREE_DAILY_LIMIT_FALLBACK,
      plans: plans
        .filter((p) => p.key !== 'free' && p.price != null)
        .map((p) => ({
          key: p.key,
          name: p.name,
          price: p.price!.toString(),
          currency: p.currency,
          period: p.period,
        })),
    };
    this.pricingCache = { data, expiresAt: Date.now() + 300_000 };
    return data;
  }

  // ── Kanun kütüphanesi (SEO) ───────────────────────────────────
  // Konu satırları (sayımsız). Konu tablosu küçük; asıl maliyet soru sayımıydı
  // — o yüzden ÖNCE kanun konularına daralt, sayımı ayrı tek groupBy'da yap.
  private async lawTopicRows() {
    const topics = await this.prisma.topic.findMany({
      where: {
        deletedAt: null,
        course: {
          deletedAt: null,
          sections: { some: { section: { deletedAt: null } } },
        },
      },
      select: {
        id: true,
        name: true,
        course: {
          select: {
            id: true,
            name: true,
            sections: {
              select: {
                section: {
                  select: {
                    name: true,
                    weightPercent: true,
                    deletedAt: true,
                    examType: { select: { key: true, name: true, isActive: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }],
    });
    return topics.filter((t) => LAW_NAME_RE.test(t.name));
  }

  /**
   * Kanun konuları + soru sayıları. Eskiden her konu için korele bir _count
   * (N alt-sorgu, tüm banka) çalışıyordu; artık yalnız kanun konularının
   * id'leriyle TEK groupBy — sayım tüm-tablo yerine daraltılmış aralık taraması.
   */
  private async lawTopics() {
    const topics = await this.lawTopicRows();
    if (topics.length === 0) return [];
    const counts = await this.prisma.question.groupBy({
      by: ['topicId'],
      where: {
        topicId: { in: topics.map((t) => t.id) },
        deletedAt: null,
        currentVersionId: { not: null },
      },
      _count: { _all: true },
    });
    const countByTopic = new Map(counts.map((c) => [c.topicId, c._count._all]));
    return topics.map((t) => ({ ...t, questionCount: countByTopic.get(t.id) ?? 0 }));
  }

  async laws() {
    const topics = await this.lawTopics();
    // Yayınlanmış metni olan kanunlar (okunabilir rozeti için) — tek groupBy.
    const readableRows =
      topics.length > 0
        ? await this.prisma.lawArticle.groupBy({
            by: ['topicId'],
            where: {
              topicId: { in: topics.map((t) => t.id) },
              status: 'published',
              deletedAt: null,
            },
          })
        : [];
    const readableIds = new Set(readableRows.map((r) => r.topicId));
    return topics.map((t) => ({
      slug: slugify(t.name),
      /** Girişli derinlik (Doc 27 W2): atlas + seans başlatma için konu kimliği. */
      topicId: t.id,
      courseId: t.course.id,
      name: t.name,
      courseName: t.course.name,
      questionCount: t.questionCount,
      /** Yayınlanmış madde metni var mı — "okunabilir" rozeti. */
      readable: readableIds.has(t.id),
      exams: this.examContexts(t.course.sections),
    }));
  }

  async lawBySlug(slug: string) {
    const topics = await this.lawTopics();
    const topic = topics.find((t) => slugify(t.name) === slug);
    if (!topic) throw new NotFoundException('Kanun sayfası bulunamadı.');

    // Örnek soru: en eski, kaynaklı olan tercih (SEO için sabit ve kanıtlı).
    // BİLİNÇLİ İSTİSNA: cevap + açıklama dahil (tam içerik indekslensin).
    const sample = await this.prisma.question.findFirst({
      where: { topicId: topic.id, deletedAt: null, currentVersionId: { not: null } },
      orderBy: [{ createdAt: 'asc' }],
      select: {
        currentVersion: {
          select: {
            stem: true,
            explanation: true,
            sourceLabel: true,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, text: true, isCorrect: true },
            },
          },
        },
      },
    });
    const showSource = await this.settings.getBool(SETTING_KEYS.showQuestionSource, true);

    // ── Madde Isı Haritası (Doc 25 §4 — Türkiye'de eşi olmayan veri):
    // bu kanunda hangi maddeden kaç soru çıkmış. Sayısal maddeler numaraya
    // göre, Ek/Geçici sona sıralanır.
    const [articleGroups, textArticles] = await Promise.all([
      this.prisma.question.groupBy({
        by: ['articleNo'],
        where: { topicId: topic.id, deletedAt: null, articleNo: { not: null } },
        _count: { _all: true },
      }),
      // Yayınlanmış resmî metni olan maddeler (Doc 25 §4) — sorusuz maddeler de
      // listelensin ki kanun okunabilsin.
      this.prisma.lawArticle.findMany({
        where: { topicId: topic.id, status: 'published', deletedAt: null },
        select: { articleNo: true },
      }),
    ]);
    const textNos = new Set(textArticles.map((r) => r.articleNo));
    const countMap = new Map(articleGroups.map((g) => [g.articleNo!, g._count._all]));
    const allNos = new Set<string>([...countMap.keys(), ...textNos]);
    const articles = [...allNos]
      .map((no) => ({
        no,
        slug: articleSlug(no),
        questionCount: countMap.get(no) ?? 0,
        hasText: textNos.has(no),
      }))
      .sort((a, b) => b.questionCount - a.questionCount || articleOrder(a.no) - articleOrder(b.no));
    const readable = textNos.size > 0;

    // İlgili kanunlar: aynı dersten, kendisi hariç (iç bağlantı örgüsü).
    const related = topics
      .filter((t) => t.course.name === topic.course.name && t.id !== topic.id)
      .slice(0, 6)
      .map((t) => ({ slug: slugify(t.name), name: t.name, questionCount: t.questionCount }));

    return {
      slug,
      topicId: topic.id,
      courseId: topic.course.id,
      name: topic.name,
      courseName: topic.course.name,
      questionCount: topic.questionCount,
      /** En az bir yayınlanmış madde metni var mı — "Kanunu oku" düğmesi için. */
      readable,
      exams: this.examContexts(topic.course.sections),
      sampleQuestion: sample?.currentVersion
        ? {
            stem: sample.currentVersion.stem,
            options: sample.currentVersion.options,
            explanation: sample.currentVersion.explanation,
            source: showSource ? sample.currentVersion.sourceLabel : null,
          }
        : null,
      articles,
      related,
    };
  }

  /**
   * Kanunu oku (Doc 25 §4 — okuma katmanı): kanunun TÜM yayınlanmış maddeleri,
   * madde sırasıyla, birebir resmî metin. Herkese açık (kanun metni kamuya açık;
   * cevap/soru sızmaz). Yalnız yayınlanmış (admin doğrulamış) metin döner.
   */
  async lawReading(slug: string) {
    const topics = await this.lawTopicRows();
    const topic = topics.find((t) => slugify(t.name) === slug);
    if (!topic) throw new NotFoundException('Kanun sayfası bulunamadı.');

    const rows = await this.prisma.lawArticle.findMany({
      where: { topicId: topic.id, status: 'published', deletedAt: null },
      select: {
        articleNo: true,
        text: true,
        sourceName: true,
        sourceUrl: true,
        effectiveInfo: true,
        lastVerifiedAt: true,
      },
    });
    if (rows.length === 0) {
      throw new NotFoundException('Bu kanunun yayınlanmış metni yok.');
    }
    const articles = rows
      .map((r) => ({ no: r.articleNo, slug: articleSlug(r.articleNo), text: r.text }))
      .sort((a, b) => articleOrder(a.no) - articleOrder(b.no));
    // Kaynak künyesi kanun genelinde tekdir (aynı içe aktarma) — ilk satır yeter.
    const src = rows[0];
    const lastVerified = rows
      .map((r) => r.lastVerifiedAt)
      .filter((d): d is Date => d != null)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      slug,
      lawName: topic.name,
      courseName: topic.course.name,
      articleCount: articles.length,
      source: src.sourceName,
      sourceUrl: src.sourceUrl,
      effectiveInfo: src.effectiveInfo,
      verifiedAt: lastVerified?.toISOString() ?? null,
      articles,
    };
  }

  /**
   * Madde detayı (Doc 25 §4 — Madde Atlası). Cevap anahtarı SIZMAZ:
   * kökler kısaltılmış teaser olarak döner (SEO içeriği + funnel).
   * Resmî madde metni V2 (kanun metni içerik hattı ayrı iş).
   */
  async articleDetail(lawSlug: string, articleSlug_: string) {
    const topics = await this.lawTopicRows(); // sayım gerekmez → ucuz yol
    const topic = topics.find((t) => slugify(t.name) === lawSlug);
    if (!topic) throw new NotFoundException('Kanun sayfası bulunamadı.');

    // Kanunun etiketli maddeleri (komşu gezinme + slug çözümü tek sorguda).
    const groups = await this.prisma.question.groupBy({
      by: ['articleNo'],
      where: { topicId: topic.id, deletedAt: null, articleNo: { not: null } },
      _count: { _all: true },
    });
    const all = groups
      .map((g) => ({ no: g.articleNo!, questionCount: g._count._all }))
      .sort((a, b) => articleOrder(a.no) - articleOrder(b.no));
    const idx = all.findIndex((a) => articleSlug(a.no) === articleSlug_);
    if (idx < 0) throw new NotFoundException('Madde bulunamadı.');
    const current = all[idx];

    // Bu maddenin soruları: kaynak dağılımı + ≤2 kısaltılmış kök önizlemesi.
    const questions = await this.prisma.question.findMany({
      where: {
        topicId: topic.id,
        deletedAt: null,
        articleNo: current.no,
        currentVersionId: { not: null },
      },
      orderBy: { createdAt: 'asc' },
      select: { currentVersion: { select: { stem: true, sourceLabel: true } } },
    });
    const showSource = await this.settings.getBool(SETTING_KEYS.showQuestionSource, true);
    const bySource = new Map<string, number>();
    for (const q of questions) {
      const s = q.currentVersion?.sourceLabel;
      if (s) bySource.set(s, (bySource.get(s) ?? 0) + 1);
    }

    // Resmî madde metni (Doc 25 §4 adım 3): YALNIZ yayınlanmış (admin doğrulamış)
    // metin istemciye gider. Taslak/incelemedeki metin sızmaz.
    const lawArticle = await this.prisma.lawArticle.findFirst({
      where: {
        topicId: topic.id,
        articleNo: current.no,
        status: 'published',
        deletedAt: null,
      },
      select: {
        text: true,
        sourceName: true,
        sourceUrl: true,
        effectiveInfo: true,
        lastVerifiedAt: true,
      },
    });

    return {
      lawSlug,
      topicId: topic.id,
      lawName: topic.name,
      courseName: topic.course.name,
      no: current.no,
      slug: articleSlug(current.no),
      questionCount: current.questionCount,
      /** Resmî madde metni (yayınlanmışsa) — Atlas'ın makale panosuna gelir. */
      text: lawArticle
        ? {
            body: lawArticle.text,
            source: lawArticle.sourceName,
            sourceUrl: lawArticle.sourceUrl,
            effectiveInfo: lawArticle.effectiveInfo,
            verifiedAt: lawArticle.lastVerifiedAt?.toISOString() ?? null,
          }
        : null,
      exams: this.examContexts(topic.course.sections),
      /** Hangi sınavda kaç kez soruldu (kaynak etiketi dağılımı). */
      sources: showSource
        ? [...bySource.entries()].map(([source, count]) => ({ source, count }))
        : [],
      /** SEO teaser'ları — cevap/şık YOK, kök 160 karakterde kesilir. */
      previews: questions.slice(0, 2).map((q) => truncate(q.currentVersion!.stem, 160)),
      neighbors: {
        prev: idx > 0 ? { no: all[idx - 1].no, slug: articleSlug(all[idx - 1].no) } : null,
        next:
          idx < all.length - 1 ? { no: all[idx + 1].no, slug: articleSlug(all[idx + 1].no) } : null,
      },
      /** Kanunun tüm etiketli maddeleri (sayfa içi hızlı gezinme). */
      siblings: all.map((a) => ({
        no: a.no,
        slug: articleSlug(a.no),
        questionCount: a.questionCount,
      })),
    };
  }

  // ── Sınav rehberi (SEO) ───────────────────────────────────────
  async examTypeGuide(key: string) {
    const examType = await this.prisma.examType.findFirst({
      where: { key, isActive: true },
      select: {
        key: true,
        name: true,
        description: true,
        sections: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            name: true,
            weightPercent: true,
            courses: {
              orderBy: { sortOrder: 'asc' },
              select: {
                course: {
                  select: {
                    name: true,
                    deletedAt: true,
                    topics: {
                      where: { deletedAt: null },
                      select: {
                        name: true,
                        _count: {
                          select: {
                            questions: {
                              where: { deletedAt: null, currentVersionId: { not: null } },
                            },
                          },
                        },
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
    if (!examType) throw new NotFoundException('Sınav bulunamadı.');

    let totalQuestions = 0;
    const sections = examType.sections.map((s) => ({
      name: s.name,
      weightPercent: s.weightPercent,
      courses: s.courses
        .filter((sc) => !sc.course.deletedAt)
        .map((sc) => {
          const questionCount = sc.course.topics.reduce((sum, t) => sum + t._count.questions, 0);
          totalQuestions += questionCount;
          return {
            name: sc.course.name,
            topicCount: sc.course.topics.length,
            questionCount,
            lawTopics: sc.course.topics
              .filter((t) => LAW_NAME_RE.test(t.name))
              .map((t) => ({ slug: slugify(t.name), name: t.name })),
          };
        }),
    }));
    return {
      key: examType.key,
      name: examType.name,
      description: examType.description,
      sections,
      totalQuestions,
    };
  }

  /** Konunun dersinin bağlı olduğu sınav bağlamları: "PAEM %10, Misyon %20". */
  private examContexts(
    sections: {
      section: {
        name: string;
        weightPercent: number;
        deletedAt: Date | null;
        examType: { key: string; name: string; isActive: boolean };
      };
    }[],
  ) {
    return sections
      .filter((s) => !s.section.deletedAt && s.section.examType.isActive)
      .map((s) => ({
        examKey: s.section.examType.key,
        examName: s.section.examType.name,
        sectionName: s.section.name,
        weightPercent: s.section.weightPercent,
      }));
  }
}

/** Madde sıralama anahtarı: sayısal maddeler önce, Ek/Geçici sona. */
function articleOrder(no: string): number {
  const n = parseInt(no, 10);
  return Number.isNaN(n) ? 10_000 : n;
}

/** Madde slug'ı: "4/A" → "4-a", "Ek 6" → "ek-6" (URL-güvenli, tersinir eşleşme). */
export function articleSlug(no: string): string {
  return no.toLocaleLowerCase('tr-TR').replace(/[\s/]+/g, '-');
}

/** Kök teaser'ı: kelime sınırında kes, tek satıra indir. */
function truncate(s: string, max: number): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
