import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';

/** TR-duyarlı URL slug'ı: "2559 Sayılı Polis Vazife..." → "2559-sayili-polis-vazife..." */
export function slugify(s: string): string {
  const map: Record<string, string> = {
    ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
    Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u', â: 'a', Â: 'a', î: 'i', û: 'u',
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
 * KURAL: cevap anahtarı yalnız iki bilinçli istisnayla dışarı çıkar:
 * günün sorusu reveal'ı (tek soru, funnel) ve kanun sayfası örnek sorusu
 * (SEO için tam içerik — sabit tek soru). Banka geneli asla sızmaz.
 */
@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  // ── Günün Sorusu ──────────────────────────────────────────────
  // Tarih tohumlu deterministik: herkes aynı soruyu görür (paylaşılabilir).
  private async questionOfDayId(): Promise<string> {
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
    const dateKey = new Date().toISOString().slice(0, 10) + ':qotd';
    let h = 0;
    for (const c of dateKey) h = (h * 31 + c.charCodeAt(0)) | 0;
    return pool[Math.abs(h) % pool.length].id;
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

  // ── Kanun kütüphanesi (SEO) ───────────────────────────────────
  private async lawTopics() {
    const topics = await this.prisma.topic.findMany({
      where: {
        deletedAt: null,
        name: { mode: 'insensitive', contains: '' }, // tüm konular; desen aşağıda
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
        _count: {
          select: {
            questions: { where: { deletedAt: null, currentVersionId: { not: null } } },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }],
    });
    return topics.filter((t) => LAW_NAME_RE.test(t.name));
  }

  async laws() {
    const topics = await this.lawTopics();
    return topics.map((t) => ({
      slug: slugify(t.name),
      name: t.name,
      courseName: t.course.name,
      questionCount: t._count.questions,
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
    const articleGroups = await this.prisma.question.groupBy({
      by: ['articleNo'],
      where: { topicId: topic.id, deletedAt: null, articleNo: { not: null } },
      _count: { _all: true },
    });
    const articles = articleGroups
      .map((g) => ({ no: g.articleNo!, questionCount: g._count._all }))
      .sort((a, b) => b.questionCount - a.questionCount || articleOrder(a.no) - articleOrder(b.no));

    // İlgili kanunlar: aynı dersten, kendisi hariç (iç bağlantı örgüsü).
    const related = topics
      .filter((t) => t.course.name === topic.course.name && t.id !== topic.id)
      .slice(0, 6)
      .map((t) => ({ slug: slugify(t.name), name: t.name, questionCount: t._count.questions }));

    return {
      slug,
      name: topic.name,
      courseName: topic.course.name,
      questionCount: topic._count.questions,
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
