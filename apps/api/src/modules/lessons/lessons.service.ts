import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { validateLesson, type LessonSourceInput, type LessonValidation } from './ders-dogrulayici';
import { parseLessonMarkdown, readingMinutes, type LessonBody } from './ders-markdown';

/** İçe aktarma girdisi (betik ya da panel): bir bölüm altına bir ders sürümü. */
export interface LessonImportInput {
  section: {
    slug: string;
    title: string;
    subtitle?: string | null;
    courseId: string;
    topicId?: string | null;
    sortOrder?: number;
    isPremium?: boolean;
  };
  slug: string;
  title: string;
  goal: string;
  sortOrder: number;
  body: LessonBody;
  sources: LessonSourceInput[];
  reviewNote: string;
  sourceLabel: string;
  links?: { kind: 'topic' | 'legislation' | 'unit'; targetId: string }[];
}

/** Panelden markdown ile içe aktarma: bölüm künyesi + ders slug'ı + markdown + kitap künyesi + madde atıfları. */
export interface LessonMarkdownImportInput {
  section: LessonImportInput['section'];
  slug: string;
  sortOrder: number;
  markdown: string;
  book: { label: string; page?: string | null };
  articles?: string[];
}

const PUBLIC_SOURCE_SELECT = {
  kind: true,
  label: true,
  url: true,
  page: true,
  lawArticleId: true,
  sortOrder: true,
} satisfies Prisma.LessonSourceSelect;

/**
 * Konu anlatımı (Doc 57): bölüm → ders → sürüm. Public yanıtta yalnız yayındaki ders ve kamuya açık
 * kaynaklar; `sourceLabel` ve kitap künyesi dışarı çıkmaz (4 Eyl 2026 kuralı). Premium bölüm, premium olmayan
 * kullanıcıya kilitli: liste görünür, gövde dönmez. Yayın kararı yalnız admin; her sürüm yayın öncesi
 * doğrulayıcıdan geçer ve inceleme kaydı taşır.
 */
@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------ public */

  /** Konuya ya da derse bağlı yayındaki bölümler + ders listesi (+ kullanıcı ilerlemesi). */
  async sectionsFor(q: { topicId?: string; courseId?: string }, user: AuthenticatedUser | null) {
    const where: Prisma.LessonSectionWhereInput = { status: 'published', deletedAt: null };
    if (q.topicId)
      where.OR = [
        { topicId: q.topicId },
        { lessons: { some: { links: { some: { kind: 'topic', targetId: q.topicId } } } } },
      ];
    else if (q.courseId) where.courseId = q.courseId;
    const sections = await this.prisma.lessonSection.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        isPremium: true,
        lessons: {
          where: { status: 'published', deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            goal: true,
            readingMinutes: true,
            version: true,
          },
        },
      },
    });
    const ids = sections.flatMap((s) => s.lessons.map((l) => l.id));
    const progress =
      user && ids.length
        ? await this.prisma.lessonProgress.findMany({
            where: { userId: user.id, lessonId: { in: ids } },
          })
        : [];
    const pMap = new Map(progress.map((p) => [p.lessonId, p]));
    return {
      sections: sections
        .filter((s) => s.lessons.length > 0)
        .map((s) => ({
          slug: s.slug,
          title: s.title,
          subtitle: s.subtitle,
          isPremium: s.isPremium,
          locked: s.isPremium && !(user?.isPremium ?? false),
          lessons: s.lessons.map((l) => {
            const p = pMap.get(l.id);
            return {
              slug: l.slug,
              title: l.title,
              goal: l.goal,
              readingMinutes: l.readingMinutes,
              version: l.version,
              progress: p
                ? {
                    offset: p.versionNo === l.version ? p.offset : 0,
                    readAt: p.readAt?.toISOString() ?? null,
                  }
                : null,
            };
          }),
        })),
    };
  }

  /** Yayındaki dersin gövdesi (yayındaki sürüm) + kamuya açık kaynaklar + komşu dersler. */
  async getLesson(slug: string, user: AuthenticatedUser | null) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        slug,
        status: 'published',
        deletedAt: null,
        section: { status: 'published', deletedAt: null },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        goal: true,
        readingMinutes: true,
        version: true,
        sortOrder: true,
        section: {
          select: {
            slug: true,
            title: true,
            isPremium: true,
            lessons: {
              where: { status: 'published', deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              select: { slug: true, title: true },
            },
          },
        },
        sources: {
          where: { isPublic: true },
          orderBy: { sortOrder: 'asc' },
          select: PUBLIC_SOURCE_SELECT,
        },
      },
    });
    if (!lesson) throw new NotFoundException('Ders bulunamadı.');
    const locked = lesson.section.isPremium && !(user?.isPremium ?? false);
    const version = locked
      ? null
      : await this.prisma.lessonVersion.findUnique({
          where: { lessonId_versionNo: { lessonId: lesson.id, versionNo: lesson.version } },
          select: { body: true },
        });
    const progress = user
      ? await this.prisma.lessonProgress.findUnique({
          where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        })
      : null;
    const order = lesson.section.lessons.findIndex((l) => l.slug === lesson.slug);
    return {
      slug: lesson.slug,
      title: lesson.title,
      goal: lesson.goal,
      readingMinutes: lesson.readingMinutes,
      version: lesson.version,
      section: {
        slug: lesson.section.slug,
        title: lesson.section.title,
        isPremium: lesson.section.isPremium,
        lessonCount: lesson.section.lessons.length,
      },
      order: order + 1,
      prev: order > 0 ? lesson.section.lessons[order - 1] : null,
      next:
        order >= 0 && order < lesson.section.lessons.length - 1
          ? lesson.section.lessons[order + 1]
          : null,
      locked,
      body: version ? (version.body as unknown as LessonBody) : null,
      sources: lesson.sources,
      progress: progress
        ? {
            offset: progress.versionNo === lesson.version ? progress.offset : 0,
            readAt: progress.readAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  /* ------------------------------------------------------------ me */

  async saveProgress(
    user: AuthenticatedUser,
    body: { slug?: string; offset?: number; read?: boolean },
  ) {
    if (!body.slug) throw new BadRequestException('slug gerekli.');
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: body.slug, status: 'published', deletedAt: null },
      select: { id: true, version: true },
    });
    if (!lesson) throw new NotFoundException('Ders bulunamadı.');
    const offset = Math.max(0, Math.round(Number(body.offset ?? 0)) || 0);
    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    });
    const readAt =
      body.read === true
        ? (existing?.readAt ?? new Date())
        : body.read === false
          ? null
          : (existing?.readAt ?? null);
    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      update: { versionNo: lesson.version, offset, readAt },
      create: { userId: user.id, lessonId: lesson.id, versionNo: lesson.version, offset, readAt },
    });
    return { ok: true, offset, readAt: readAt?.toISOString() ?? null };
  }

  /* ------------------------------------------------------------ içe aktarma + doğrulama (betik / panel) */

  async validateForImport(input: LessonImportInput): Promise<LessonValidation> {
    const sources = await this.resolveSources(input.sources);
    return validateLesson({
      slug: input.slug,
      title: input.title,
      goal: input.goal,
      body: input.body,
      sources,
      reviewNote: input.reviewNote,
      sourceLabel: input.sourceLabel,
    });
  }

  /** Doğrulamayı geçen dersi in_review olarak yazar; ders varsa yeni sürüm açar (yayındaki sürüm değişmez). */
  async importLesson(input: LessonImportInput, actorId: string | null) {
    const sources = await this.resolveSources(input.sources);
    const validation = validateLesson({
      slug: input.slug,
      title: input.title,
      goal: input.goal,
      body: input.body,
      sources,
      reviewNote: input.reviewNote,
      sourceLabel: input.sourceLabel,
    });
    if (!validation.ok)
      throw new BadRequestException(
        [
          `Doğrulama geçmedi: ${validation.issues.length} kusur.`,
          ...validation.issues.map((i) => `✗ ${i}`),
        ].join('\n'),
      );

    const section = await this.prisma.lessonSection.upsert({
      where: { slug: input.section.slug },
      update: {
        title: input.section.title,
        subtitle: input.section.subtitle ?? null,
        topicId: input.section.topicId ?? null,
        sortOrder: input.section.sortOrder ?? 0,
      },
      create: {
        slug: input.section.slug,
        title: input.section.title,
        subtitle: input.section.subtitle ?? null,
        courseId: input.section.courseId,
        topicId: input.section.topicId ?? null,
        sortOrder: input.section.sortOrder ?? 0,
        isPremium: input.section.isPremium ?? false,
      },
      select: { id: true },
    });
    const existing = await this.prisma.lesson.findUnique({
      where: { slug: input.slug },
      select: {
        id: true,
        status: true,
        versions: { select: { versionNo: true }, orderBy: { versionNo: 'desc' }, take: 1 },
      },
    });
    const minutes = readingMinutes(input.body);
    const bodyJson = input.body as unknown as Prisma.InputJsonValue;
    const sourceRows = sources.map((s, i) => ({
      kind: s.kind,
      label: s.label,
      url: s.url ?? null,
      page: s.page ?? null,
      lawArticleId: (s as { lawArticleId?: string | null }).lawArticleId ?? null,
      isPublic: s.isPublic ?? s.kind !== 'book',
      sortOrder: i,
    }));
    const links = (input.links ?? []).map((l) => ({ kind: l.kind, targetId: l.targetId }));

    const result = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        const versionNo = (existing.versions[0]?.versionNo ?? 0) + 1;
        await tx.lessonVersion.create({
          data: {
            lessonId: existing.id,
            versionNo,
            body: bodyJson,
            reviewNote: input.reviewNote,
            createdBy: actorId,
          },
        });
        await tx.lesson.update({
          where: { id: existing.id },
          data: {
            sectionId: section.id,
            title: input.title,
            goal: input.goal,
            sortOrder: input.sortOrder,
            readingMinutes: minutes,
            sourceLabel: input.sourceLabel,
            ...(existing.status === 'published' ? {} : { version: versionNo }),
          },
        });
        await tx.lessonSource.deleteMany({ where: { lessonId: existing.id } });
        await tx.lessonSource.createMany({
          data: sourceRows.map((s) => ({ ...s, lessonId: existing.id })),
        });
        await tx.lessonLink.deleteMany({ where: { lessonId: existing.id } });
        if (links.length)
          await tx.lessonLink.createMany({
            data: links.map((l) => ({ ...l, lessonId: existing.id })),
          });
        return {
          id: existing.id,
          versionNo,
          replaced: true,
          pendingVersion: existing.status === 'published',
        };
      }
      const lesson = await tx.lesson.create({
        data: {
          sectionId: section.id,
          slug: input.slug,
          title: input.title,
          goal: input.goal,
          sortOrder: input.sortOrder,
          readingMinutes: minutes,
          sourceLabel: input.sourceLabel,
          version: 1,
          createdBy: actorId,
          status: 'in_review',
        },
        select: { id: true },
      });
      await tx.lessonVersion.create({
        data: {
          lessonId: lesson.id,
          versionNo: 1,
          body: bodyJson,
          reviewNote: input.reviewNote,
          createdBy: actorId,
        },
      });
      await tx.lessonSource.createMany({
        data: sourceRows.map((s) => ({ ...s, lessonId: lesson.id })),
      });
      if (links.length)
        await tx.lessonLink.createMany({ data: links.map((l) => ({ ...l, lessonId: lesson.id })) });
      return { id: lesson.id, versionNo: 1, replaced: false, pendingVersion: false };
    });
    return { ...result, slug: input.slug, validation };
  }

  /** Markdown'ı betikle aynı kurallarla girdiye çevirir (panel içe aktarma). */
  markdownToImport(m: LessonMarkdownImportInput): LessonImportInput {
    const parsed = parseLessonMarkdown(m.markdown);
    const page = m.book.page ?? null;
    return {
      section: m.section,
      slug: m.slug,
      title: parsed.title,
      goal: parsed.goal,
      sortOrder: m.sortOrder,
      body: parsed.body,
      sources: [
        { kind: 'book', label: m.book.label, page, isPublic: false },
        ...(m.articles ?? []).map(
          (ref) =>
            ({ kind: 'article' as const, label: ref, ref, isPublic: true }) as LessonSourceInput,
        ),
        ...parsed.urlSources.map((u) => ({
          kind: 'url' as const,
          label: u.label,
          url: u.url,
          isPublic: true,
        })),
      ],
      reviewNote: parsed.reviewNotes.join('\n'),
      sourceLabel: `${m.book.label} ${page ?? ''}`.trim(),
      links: m.section.topicId ? [{ kind: 'topic', targetId: m.section.topicId }] : [],
    };
  }

  async updateLesson(
    actor: AuthenticatedUser,
    id: string,
    dto: {
      title?: string;
      goal?: string;
      sourceLabel?: string;
      sortOrder?: number;
      readingMinutes?: number;
    },
  ) {
    const data: Prisma.LessonUpdateInput = {};
    if (typeof dto.title === 'string' && dto.title.trim()) data.title = dto.title.trim();
    if (typeof dto.goal === 'string' && dto.goal.trim()) data.goal = dto.goal.trim();
    if (typeof dto.sourceLabel === 'string' && dto.sourceLabel.trim())
      data.sourceLabel = dto.sourceLabel.trim();
    if (typeof dto.sortOrder === 'number') data.sortOrder = dto.sortOrder;
    if (typeof dto.readingMinutes === 'number' && dto.readingMinutes > 0)
      data.readingMinutes = Math.round(dto.readingMinutes);
    await this.prisma.lesson.update({ where: { id }, data });
    return { ok: true };
  }

  /** En son sürümün inceleme kaydı (yayın kapısı için zorunlu). */
  async setReviewNote(actor: AuthenticatedUser, id: string, reviewNote: string) {
    const latest = await this.prisma.lessonVersion.findFirst({
      where: { lessonId: id },
      orderBy: { versionNo: 'desc' },
      select: { id: true },
    });
    if (!latest) throw new NotFoundException('Sürüm yok.');
    await this.prisma.lessonVersion.update({
      where: { id: latest.id },
      data: { reviewNote: reviewNote.trim() || null },
    });
    return { ok: true };
  }

  async updateSection(
    actor: AuthenticatedUser,
    id: string,
    dto: { title?: string; subtitle?: string | null; sortOrder?: number; isPremium?: boolean },
  ) {
    if (typeof dto.isPremium === 'boolean' && !actor.roles.includes('admin'))
      throw new ForbiddenException('Premium kararı admin yetkisi ister.');
    const data: Prisma.LessonSectionUpdateInput = {};
    if (typeof dto.title === 'string' && dto.title.trim()) data.title = dto.title.trim();
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle?.trim() || null;
    if (typeof dto.sortOrder === 'number') data.sortOrder = dto.sortOrder;
    if (typeof dto.isPremium === 'boolean') data.isPremium = dto.isPremium;
    await this.prisma.lessonSection.update({ where: { id }, data });
    return { ok: true };
  }

  async unpublishSection(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayından alma admin yetkisi ister.');
    await this.prisma.$transaction([
      this.prisma.lessonSection.update({ where: { id }, data: { status: 'in_review' } }),
      this.prisma.lesson.updateMany({
        where: { sectionId: id, status: 'published' },
        data: { status: 'in_review' },
      }),
    ]);
    return { ok: true };
  }

  /** "article" kaynaklarını bankadan çözer: label "<lawSlug>:<no>" ya da ayrı alanlar. */
  private async resolveSources(sources: LessonSourceInput[]) {
    const out: (LessonSourceInput & { lawArticleId?: string | null })[] = [];
    for (const s of sources) {
      if (s.kind !== 'article') {
        out.push(s);
        continue;
      }
      const ref = (s as { ref?: string }).ref ?? s.label;
      const m = ref.match(/^([a-z0-9-]+):(.+)$/i);
      const row = m
        ? await this.prisma.lawArticle.findFirst({
            where: {
              legislation: { slug: m[1] },
              articleNo: m[2].trim(),
              status: 'published',
              deletedAt: null,
            },
            select: {
              id: true,
              articleNo: true,
              text: true,
              legislation: { select: { shortName: true, name: true } },
            },
          })
        : null;
      out.push({
        ...s,
        label: row
          ? `${row.legislation?.shortName ?? row.legislation?.name} md ${row.articleNo}`
          : s.label,
        article: row ? { articleNo: row.articleNo, text: row.text } : null,
        lawArticleId: row?.id ?? null,
      });
    }
    return out;
  }

  /* ------------------------------------------------------------ admin (asgari; panel B aşamasında) */

  async adminList() {
    return this.prisma.lessonSection.findMany({
      where: { deletedAt: null },
      orderBy: [{ courseId: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        isPremium: true,
        publishedAt: true,
        course: { select: { name: true } },
        topic: { select: { name: true } },
        lessons: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            version: true,
            sourceLabel: true,
            readingMinutes: true,
            publishedAt: true,
            updatedAt: true,
            _count: { select: { versions: true } },
          },
        },
      },
    });
  }

  async adminDetail(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: { select: { slug: true, title: true, status: true, isPremium: true } },
        versions: { orderBy: { versionNo: 'desc' } },
        sources: { orderBy: { sortOrder: 'asc' } },
        links: true,
      },
    });
    if (!lesson) throw new NotFoundException('Ders bulunamadı.');
    const latest = lesson.versions[0];
    const sources: LessonSourceInput[] = [];
    for (const s of lesson.sources) {
      const article = s.lawArticleId
        ? await this.prisma.lawArticle.findUnique({
            where: { id: s.lawArticleId },
            select: { articleNo: true, text: true },
          })
        : null;
      sources.push({
        kind: s.kind,
        label: s.label,
        url: s.url,
        page: s.page,
        isPublic: s.isPublic,
        article,
      });
    }
    const validation = latest
      ? validateLesson({
          slug: lesson.slug,
          title: lesson.title,
          goal: lesson.goal,
          body: latest.body as unknown as LessonBody,
          sources,
          reviewNote: latest.reviewNote,
          sourceLabel: lesson.sourceLabel,
        })
      : { ok: false, issues: ['sürüm yok'], lines: ['✗ sürüm yok'] };
    return { ...lesson, latestVersionNo: latest?.versionNo ?? null, validation };
  }

  /** Yayın (admin): en son sürüm doğrulamayı geçmeli; bölüm de yayınlanır. */
  async publish(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayın kararı admin yetkisi ister.');
    const d = await this.adminDetail(id);
    if (!d.validation.ok)
      throw new BadRequestException(
        [
          `${d.validation.issues.length} kusur var; yayınlanamaz.`,
          ...d.validation.issues.map((i) => `✗ ${i}`),
        ].join('\n'),
      );
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.lesson.update({
        where: { id },
        data: {
          status: 'published',
          version: d.latestVersionNo!,
          publishedAt: now,
          publishedBy: actor.id,
        },
      }),
      this.prisma.lessonSection.updateMany({
        where: { id: d.sectionId, status: { not: 'published' } },
        data: { status: 'published', publishedAt: now },
      }),
    ]);
    return { ok: true, version: d.latestVersionNo };
  }

  async unpublish(actor: AuthenticatedUser, id: string) {
    if (!actor.roles.includes('admin'))
      throw new ForbiddenException('Yayından alma admin yetkisi ister.');
    await this.prisma.lesson.update({ where: { id }, data: { status: 'in_review' } });
    return { ok: true };
  }

  async setSectionPremium(actor: AuthenticatedUser, sectionId: string, isPremium: boolean) {
    if (!actor.roles.includes('admin')) throw new ForbiddenException('Admin yetkisi ister.');
    await this.prisma.lessonSection.update({ where: { id: sectionId }, data: { isPremium } });
    return { ok: true };
  }
}
