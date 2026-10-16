import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { IPTAL_EDILMEMIS } from '../../common/iptal-soru';
import { articleSlug, truncate } from './public.service';

/**
 * Mevzuat Merkezi public uçları (Doc 29 §12). Kanun kimliği artık kalıcı
 * `legislation` kaydı — regex/slugify türetmesi yok. Yalnız status=published
 * mevzuat ve maddeler dışarı çıkar (güven ilkesi).
 *
 * Arama üç katman: (1) kimlik — kısaltma/numara/ad (küçük tablo, bellekte),
 * (2) "CMK 90" deseni — kimlik + madde no doğrudan isabet,
 * (3) tam metin — Postgres FTS (simple + tr_unaccent, GIN).
 */

/** Highlight ayraçları — istemci bunlara bölerek vurgular (metinde geçmez). */
export const HL_OPEN = '⟪';
export const HL_CLOSE = '⟫';
/** Madde soru listesinde en çok gösterilen önizleme (sayım `count` tam kalır). */
export const ARTICLE_QUESTIONS_LIMIT = 20;

type LegislationRow = {
  id: string;
  slug: string;
  type: string;
  number: string | null;
  name: string;
  shortName: string | null;
  aliases: string[];
  topicId: string | null;
  lastVerifiedAt: Date | null;
  /** Yayınlanmış (okunabilir) madde sayısı — 0 ise okuyucu kapalı. */
  articleCount: number;
};

/** TR-duyarlı normalize: küçült + aksan düşür (SQL tr_unaccent ile hizalı). */
function norm(s: string): string {
  const map: Record<string, string> = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    â: 'a',
    î: 'i',
    û: 'u',
  };
  return s
    .toLocaleLowerCase('tr-TR')
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('');
}

@Injectable()
export class MevzuatService {
  constructor(private readonly prisma: PrismaService) {}

  // Kimlik listesi küçük (≤~100 satır) — 60 sn process cache; yayınlama
  // anında bustIdentityCache() ile anında tazelenir (metin-yakında gecikmesi
  // yaşanmasın).
  private identityCache: { rows: LegislationRow[]; expiresAt: number } | null = null;

  /** Admin yayınla/güncelle sonrası çağrılır — liste anında tazelenir. */
  bustIdentityCache(): void {
    this.identityCache = null;
  }

  /** TÜM mevzuat kimlikleri (metinsizler dahil) — liste/arama bunları görür.
   *  Metin güvenliği okuyucuda: yalnız status=published maddeler döner. */
  private async allLegislation(): Promise<LegislationRow[]> {
    if (this.identityCache && this.identityCache.expiresAt > Date.now()) {
      return this.identityCache.rows;
    }
    const raw = await this.prisma.legislation.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        slug: true,
        type: true,
        number: true,
        name: true,
        shortName: true,
        aliases: true,
        topicId: true,
        lastVerifiedAt: true,
        _count: {
          select: {
            articles: { where: { status: 'published', deletedAt: null } },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const rows = raw.map(({ _count, ...r }) => ({
      ...r,
      articleCount: _count.articles,
    }));
    this.identityCache = { rows, expiresAt: Date.now() + 60_000 };
    return rows;
  }

  /** Soru sayıları: kanun (topic) başına toplam — quiz köprüsü rozetleri. */
  private async questionCounts(topicIds: string[]): Promise<Map<string, number>> {
    if (topicIds.length === 0) return new Map();
    const rows = await this.prisma.question.groupBy({
      by: ['topicId'],
      where: { topicId: { in: topicIds }, deletedAt: null },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.topicId, r._count._all]));
  }

  /** GET /public/mevzuat — TÜM mevzuat; metinsizler "readable: false" ile. */
  async list() {
    const legs = await this.allLegislation();
    const qCounts = await this.questionCounts(
      legs.map((l) => l.topicId).filter((x): x is string => x != null),
    );
    return {
      items: legs.map((l) => ({
        slug: l.slug,
        type: l.type,
        number: l.number,
        name: l.name,
        shortName: l.shortName,
        articleCount: l.articleCount,
        readable: l.articleCount > 0,
        questionCount: l.topicId ? (qCounts.get(l.topicId) ?? 0) : 0,
        lastVerifiedAt: l.lastVerifiedAt?.toISOString() ?? null,
        topicId: l.topicId,
      })),
    };
  }

  private async bySlugOr404(slug: string) {
    const leg = await this.prisma.legislation.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!leg) throw new NotFoundException('Mevzuat bulunamadı.');
    return leg;
  }

  /** GET /public/mevzuat/:slug — kimlik + içindekiler (madde metni YOK). */
  async detail(slug: string) {
    const leg = await this.bySlugOr404(slug);
    const [articles, sections, qByArticle] = await Promise.all([
      this.prisma.lawArticle.findMany({
        where: { legislationId: leg.id, status: 'published', deletedAt: null },
        select: { articleNo: true, title: true, sortKey: true, sectionId: true },
        orderBy: { sortKey: 'asc' },
      }),
      this.prisma.legislationSection.findMany({
        where: { legislationId: leg.id },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, parentId: true, heading: true, sortOrder: true },
      }),
      leg.topicId
        ? this.prisma.question.groupBy({
            by: ['articleNo'],
            where: { topicId: leg.topicId, deletedAt: null, articleNo: { not: null } },
            _count: { _all: true },
          })
        : Promise.resolve([] as { articleNo: string | null; _count: { _all: number } }[]),
    ]);
    const qMap = new Map(qByArticle.map((r) => [r.articleNo, r._count._all]));
    return {
      slug: leg.slug,
      type: leg.type,
      number: leg.number,
      name: leg.name,
      shortName: leg.shortName,
      topicId: leg.topicId,
      officialSourceUrl: leg.officialSourceUrl,
      effectiveInfo: leg.effectiveInfo,
      lastVerifiedAt: leg.lastVerifiedAt?.toISOString() ?? null,
      articleCount: articles.length,
      questionCount: [...qMap.values()].reduce((a, b) => a + b, 0),
      sections,
      toc: articles.map((a) => ({
        no: a.articleNo,
        slug: articleSlug(a.articleNo),
        title: a.title,
        sectionId: a.sectionId,
        questionCount: qMap.get(a.articleNo) ?? 0,
      })),
    };
  }

  /**
   * GET /public/mevzuat/:slug/:no/questions (Doc 49 S1-B §2) — maddeye BAĞLI
   * (question_articles N:N) yayımlı soruların sayısı ve kök önizlemeleri.
   * Anahtar/şık/açıklama yok (funnel ilkesi); kaynak etiketi yok (4 Eyl kararı).
   * Girişliyse her soru için "çözdün / son cevabın doğru muydu" eklenir.
   * Madde yalnız YAYIMLI metinler arasından çözülür — taslak madde sızmaz.
   */
  async articleQuestions(slug: string, articleSlug_: string, userId?: string) {
    const leg = await this.bySlugOr404(slug);
    const articles = await this.prisma.lawArticle.findMany({
      where: { legislationId: leg.id, status: 'published', deletedAt: null },
      select: { id: true, articleNo: true, title: true },
    });
    const article = articles.find((a) => articleSlug(a.articleNo) === articleSlug_);
    if (!article) throw new NotFoundException('Madde bulunamadı.');

    const baglar = await this.prisma.questionArticle.findMany({
      where: {
        lawArticleId: article.id,
        question: {
          deletedAt: null,
          currentVersion: { is: { status: 'published' } },
          ...IPTAL_EDILMEMIS,
        },
      },
      select: {
        relation: true,
        question: {
          select: {
            id: true,
            createdAt: true,
            currentVersion: { select: { stem: true } },
            topic: { select: { name: true } },
          },
        },
      },
    });
    // Dayanak (primary) önce, sonra eskiden yeniye (SEO için sabit sıra).
    baglar.sort(
      (a, b) =>
        Number(b.relation === 'primary') - Number(a.relation === 'primary') ||
        a.question.createdAt.getTime() - b.question.createdAt.getTime(),
    );
    const sayfa = baglar.slice(0, ARTICLE_QUESTIONS_LIMIT);

    const benim = userId
      ? await this.sonCevaplar(
          userId,
          sayfa.map((b) => b.question.id),
        )
      : null;

    return {
      lawSlug: leg.slug,
      lawName: leg.name,
      no: article.articleNo,
      slug: articleSlug(article.articleNo),
      title: article.title,
      count: baglar.length,
      primaryCount: baglar.filter((b) => b.relation === 'primary').length,
      items: sayfa.map((b) => ({
        questionId: b.question.id,
        relation: b.relation,
        stem: truncate(b.question.currentVersion?.stem ?? '', 200),
        topicName: b.question.topic.name,
        me: benim ? (benim.get(b.question.id) ?? { solved: false, correct: null }) : undefined,
      })),
    };
  }

  /** Kullanıcının bu sorulara SON cevabı (çözdü mü, doğru muydu) — tek sorgu. */
  private async sonCevaplar(userId: string, questionIds: string[]) {
    const out = new Map<string, { solved: boolean; correct: boolean | null }>();
    if (questionIds.length === 0) return out;
    const rows = await this.prisma.quizAnswer.findMany({
      where: {
        questionId: { in: questionIds },
        selectedOptionId: { not: null },
        session: { userId },
      },
      orderBy: { answeredAt: 'desc' },
      select: { questionId: true, isCorrect: true },
    });
    for (const r of rows)
      if (!out.has(r.questionId)) out.set(r.questionId, { solved: true, correct: r.isCorrect });
    return out;
  }

  /** GET /public/mevzuat/:slug/oku — okuyucu: tam metin + bölümler + soru sayıları. */
  async reader(slug: string) {
    const leg = await this.bySlugOr404(slug);
    const [articles, sections, qByArticle] = await Promise.all([
      this.prisma.lawArticle.findMany({
        where: { legislationId: leg.id, status: 'published', deletedAt: null },
        select: {
          articleNo: true,
          title: true,
          text: true,
          sectionId: true,
          sourceName: true,
          sourceUrl: true,
          effectiveInfo: true,
          lastVerifiedAt: true,
        },
        orderBy: { sortKey: 'asc' },
      }),
      this.prisma.legislationSection.findMany({
        where: { legislationId: leg.id },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, parentId: true, heading: true, sortOrder: true },
      }),
      leg.topicId
        ? this.prisma.question.groupBy({
            by: ['articleNo'],
            where: { topicId: leg.topicId, deletedAt: null, articleNo: { not: null } },
            _count: { _all: true },
          })
        : Promise.resolve([] as { articleNo: string | null; _count: { _all: number } }[]),
    ]);
    if (articles.length === 0) throw new NotFoundException('Bu mevzuatın okunabilir metni yok.');
    const qMap = new Map(qByArticle.map((r) => [r.articleNo, r._count._all]));
    const first = articles[0];
    return {
      slug: leg.slug,
      name: leg.name,
      shortName: leg.shortName,
      number: leg.number,
      type: leg.type,
      topicId: leg.topicId,
      articleCount: articles.length,
      // Kaynak künyesi kanun düzeyinde bir kez (madde satırları şişmesin).
      source: first.sourceName,
      sourceUrl: leg.officialSourceUrl ?? first.sourceUrl,
      effectiveInfo: leg.effectiveInfo ?? first.effectiveInfo,
      verifiedAt: (leg.lastVerifiedAt ?? first.lastVerifiedAt)?.toISOString() ?? null,
      sections,
      articles: articles.map((a) => ({
        no: a.articleNo,
        slug: articleSlug(a.articleNo),
        title: a.title,
        text: a.text,
        sectionId: a.sectionId,
        questionCount: qMap.get(a.articleNo) ?? 0,
      })),
    };
  }

  /**
   * GET /public/mevzuat/search?q=
   * Sorgu anlama: "2559" → kanun; "pvsk"/"p.v.s.k" → kanun; "cmk 90" →
   * doğrudan madde; "4/A" → tüm kanunlarda o madde; kalanı tam metin FTS.
   */
  async search(rawQ: string) {
    const q = rawQ.trim().slice(0, 80);
    if (q.length < 2) return { legislation: [], articles: [] };
    const legs = await this.allLegislation();
    const nq = norm(q).replace(/\./g, ''); // "p.v.s.k" → "pvsk"

    // 1) Kimlik eşleşmeleri (bellekte — tablo küçük).
    const legScore = (l: LegislationRow): number => {
      const short = l.shortName ? norm(l.shortName) : null;
      if (short === nq || l.number === nq) return 100;
      if (l.aliases.some((a) => norm(a).replace(/\./g, '') === nq)) return 90;
      if (short?.startsWith(nq) || l.number?.startsWith(nq)) return 60;
      if (l.aliases.some((a) => norm(a).includes(nq))) return 50;
      if (norm(l.name).includes(nq)) return 40;
      return 0;
    };
    const legMatches = legs
      .map((l) => ({ l, s: legScore(l) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5);

    // 2) "cmk 90" / "pvsk 4/a" deseni → doğrudan madde isabeti.
    const directArticles: {
      lawSlug: string;
      lawShort: string | null;
      no: string;
      slug: string;
      title: string | null;
      headline: string;
    }[] = [];
    const m = /^(.+?)\s+(\d+(?:\/[a-zA-ZçğıöşüÇĞİÖŞÜ])?|ek\s*\d+|geçici\s*\d+)$/i.exec(q);
    if (m) {
      const prefix = norm(m[1]).replace(/\./g, '');
      const target = legs.find(
        (l) =>
          (l.shortName && norm(l.shortName) === prefix) ||
          l.number === prefix ||
          l.aliases.some((a) => norm(a).replace(/\./g, '') === prefix),
      );
      if (target) {
        const noNorm = m[2].replace(/\s+/g, ' ').trim();
        const article = await this.prisma.lawArticle.findFirst({
          where: {
            legislationId: target.id,
            status: 'published',
            deletedAt: null,
            articleNo: { equals: noNorm, mode: 'insensitive' },
          },
          select: { articleNo: true, title: true, text: true },
        });
        if (article) {
          directArticles.push({
            lawSlug: target.slug,
            lawShort: target.shortName,
            no: article.articleNo,
            slug: articleSlug(article.articleNo),
            title: article.title,
            headline: article.text.replace(/\s+/g, ' ').slice(0, 180),
          });
        }
      }
    }

    // 3) Tam metin FTS (kimlik sorgusu net kanun bulduysa gürültü ekleme).
    let ftsArticles: typeof directArticles = [];
    const skipFts = directArticles.length > 0 || legMatches.some((x) => x.s >= 90);
    if (!skipFts) {
      const rows = await this.prisma.$queryRaw<
        {
          article_no: string;
          title: string | null;
          slug: string;
          short_name: string | null;
          headline: string;
        }[]
      >(Prisma.sql`
        SELECT la.article_no, la.title, l.slug, l.short_name,
               ts_headline('simple', la.text,
                 websearch_to_tsquery('simple', ${q.toLocaleLowerCase('tr-TR')}),
                 'StartSel=${Prisma.raw(HL_OPEN)}, StopSel=${Prisma.raw(HL_CLOSE)}, MaxWords=28, MinWords=12') AS headline
        FROM law_articles la
        JOIN legislation l ON l.id = la.legislation_id AND l.status = 'published' AND l.deleted_at IS NULL
        WHERE la.status = 'published' AND la.deleted_at IS NULL
          AND la.search @@ websearch_to_tsquery('simple', tr_unaccent(${q}))
        ORDER BY ts_rank(la.search, websearch_to_tsquery('simple', tr_unaccent(${q}))) DESC
        LIMIT 20`);
      ftsArticles = rows.map((r) => ({
        lawSlug: r.slug,
        lawShort: r.short_name,
        no: r.article_no,
        slug: articleSlug(r.article_no),
        title: r.title,
        headline: r.headline,
      }));
    }

    // 4) Typo toleransı (Doc 29 P1): hiçbir katman sonuç vermediyse trigram
    //    benzerliğiyle kanun kimliği dene ("polis vazfe" → PVSK).
    let fuzzyLegs: LegislationRow[] = [];
    if (legMatches.length === 0 && directArticles.length === 0 && ftsArticles.length === 0) {
      // word_similarity: sorgu, adın EN İYİ eşleşen parçasıyla ölçülür —
      // uzun kanun adı benzerliği sulandırmaz ("polis vazfe" → PVSK).
      const rows = await this.prisma.$queryRaw<{ slug: string }[]>(Prisma.sql`
        SELECT slug FROM legislation
        WHERE deleted_at IS NULL
          AND word_similarity(
                tr_unaccent(${q}),
                tr_unaccent(name || ' ' || COALESCE(short_name, ''))
              ) > 0.45
        ORDER BY word_similarity(
                tr_unaccent(${q}),
                tr_unaccent(name || ' ' || COALESCE(short_name, ''))
              ) DESC
        LIMIT 3`);
      const bySlug = new Map(legs.map((l) => [l.slug, l]));
      fuzzyLegs = rows.map((r) => bySlug.get(r.slug)).filter((x): x is LegislationRow => x != null);
    }

    return {
      legislation: [...legMatches.map(({ l }) => l), ...fuzzyLegs].map((l) => ({
        slug: l.slug,
        type: l.type,
        number: l.number,
        name: l.name,
        shortName: l.shortName,
        readable: l.articleCount > 0,
      })),
      articles: [...directArticles, ...ftsArticles],
    };
  }
}
