import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UpsertLawArticleDto } from '../dto/law-article.dto';
import { canonicalArticleNo, parseLawText } from './law-text-parser';
import { extractPdfLawText } from './pdf-law-text';

/** Panelden PDF/metin toplu içe aktarma seçenekleri. */
export interface ImportLawOptions {
  buffer: Buffer;
  filename: string;
  /** true: PDF'teki TÜM maddeler; false: yalnız soru etiketli maddeler. */
  all: boolean;
  /** true: doğrudan yayınla (yalnız admin); false: taslak. */
  publish: boolean;
  /** true: yayınlanmış maddeleri de üzerine yaz (yalnız admin). */
  force: boolean;
  /** true: yazma, yalnız rapor döndür. */
  dryRun: boolean;
  sourceName?: string;
  sourceUrl?: string;
  effectiveInfo?: string;
}

/** Kanun sayfası sayılacak konu adı deseni (public tarafla aynı — Doc 23). */
const LAW_NAME_RE = /sayılı|kanun|yönetmeli|khk|mevzuat/i;

/**
 * Resmî madde metni yönetimi (Doc 25 §4 adım 3). Kanun = Topic; madde =
 * Question.articleNo etiketiyle aynı kanonik biçim. Editör metni girer/düzeltir
 * (taslak); YAYIN yalnız admin'de (mevzuat güvencesi — soru onayıyla aynı ilke).
 * Metin AI ile üretilmez — birebir resmî metin; kaynak her zaman görünür.
 */
@Injectable()
export class AdminLawArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Soru etiketli maddesi olan kanunlar + metin kapsama sayıları (worklist). */
  async laws() {
    const tagged = await this.prisma.question.groupBy({
      by: ['topicId', 'articleNo'],
      where: { deletedAt: null, articleNo: { not: null } },
    });
    if (tagged.length === 0) return [];

    const topicIds = [...new Set(tagged.map((r) => r.topicId))];
    const [topics, laRows] = await Promise.all([
      this.prisma.topic.findMany({
        where: { id: { in: topicIds }, deletedAt: null },
        select: { id: true, name: true, course: { select: { name: true } } },
      }),
      this.prisma.lawArticle.findMany({
        where: { topicId: { in: topicIds }, deletedAt: null },
        select: { topicId: true, articleNo: true, status: true },
      }),
    ]);
    const statusOf = new Map(laRows.map((r) => [`${r.topicId}|${r.articleNo}`, r.status]));

    const taggedCount = new Map<string, number>();
    const pubCount = new Map<string, number>();
    const draftCount = new Map<string, number>();
    for (const r of tagged) {
      taggedCount.set(r.topicId, (taggedCount.get(r.topicId) ?? 0) + 1);
      const st = statusOf.get(`${r.topicId}|${r.articleNo!}`);
      if (st === 'published') pubCount.set(r.topicId, (pubCount.get(r.topicId) ?? 0) + 1);
      else if (st) draftCount.set(r.topicId, (draftCount.get(r.topicId) ?? 0) + 1);
    }

    return (
      topics
        .map((t) => {
          const tagged_ = taggedCount.get(t.id) ?? 0;
          const published = pubCount.get(t.id) ?? 0;
          const drafts = draftCount.get(t.id) ?? 0;
          return {
            topicId: t.id,
            name: t.name,
            courseName: t.course.name,
            taggedArticles: tagged_,
            published,
            drafts,
            missing: Math.max(0, tagged_ - published - drafts),
          };
        })
        // En çok eksik (yayınlanmamış) olan kanun üste — worklist önceliği.
        .sort((a, b) => b.taggedArticles - b.published - (a.taggedArticles - a.published))
    );
  }

  /**
   * TÜM kanun-benzeri konular (soru etiketi şartı YOK) — panelde "madde no ile
   * ekle" için herhangi bir kanunu seçebilmek. İsimle aranır; kanun deseni
   * (LAW_NAME_RE) süzer. Kapsama sayısı yok (worklist ayrı) — sade seçici.
   */
  async allLaws(search?: string) {
    const q = search?.trim();
    const topics = await this.prisma.topic.findMany({
      where: {
        deletedAt: null,
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      select: { id: true, name: true, course: { select: { name: true } } },
      orderBy: { name: 'asc' },
      take: 200,
    });
    return topics
      .filter((t) => LAW_NAME_RE.test(t.name))
      .slice(0, 50)
      .map((t) => ({ topicId: t.id, name: t.name, courseName: t.course.name }));
  }

  /** Bir kanunun maddeleri: etiketli sorular ∪ girilmiş metinler (birleşik). */
  async articles(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, name: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Kanun bulunamadı.');

    const [tagged, existing] = await Promise.all([
      this.prisma.question.groupBy({
        by: ['articleNo'],
        where: { topicId, deletedAt: null, articleNo: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.lawArticle.findMany({
        where: { topicId, deletedAt: null },
        select: {
          id: true,
          articleNo: true,
          text: true,
          status: true,
          sourceName: true,
          sourceUrl: true,
          effectiveInfo: true,
          lastVerifiedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const byNo = new Map(existing.map((e) => [e.articleNo, e]));
    const countOf = new Map(tagged.map((t) => [t.articleNo!, t._count._all]));
    const allNos = new Set<string>([...countOf.keys(), ...byNo.keys()]);

    const items = [...allNos]
      .map((no) => {
        const e = byNo.get(no) ?? null;
        return {
          articleNo: no,
          questionCount: countOf.get(no) ?? 0,
          id: e?.id ?? null,
          status: e?.status ?? null,
          hasText: e != null,
          text: e?.text ?? null,
          sourceName: e?.sourceName ?? null,
          sourceUrl: e?.sourceUrl ?? null,
          effectiveInfo: e?.effectiveInfo ?? null,
          lastVerifiedAt: e?.lastVerifiedAt?.toISOString() ?? null,
          updatedAt: e?.updatedAt?.toISOString() ?? null,
        };
      })
      .sort((a, b) => articleOrder(a.articleNo) - articleOrder(b.articleNo));

    return { topicId: topic.id, name: topic.name, articles: items };
  }

  /** Metin oluştur/güncelle. Düzenleme = yeniden doğrulama → taslağa döner. */
  async upsert(actor: AuthenticatedUser, dto: UpsertLawArticleDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
      select: { id: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Kanun bulunamadı.');

    // Elle girilen madde no kanonikleşir ("ek 6"→"Ek 6") → Question.articleNo
    // ile hizalı; böylece Atlas'ta soru grubu ve seans metni eşleşir.
    const articleNo = canonicalArticleNo(dto.articleNo);
    const text = dto.text.trim();
    if (!articleNo) {
      throw new BadRequestException('Geçersiz madde numarası (ör. 78, 4/A, Ek 6, Geçici 2).');
    }
    if (!text) {
      throw new BadRequestException('Madde metni gerekli.');
    }
    const sourceName = dto.sourceName?.trim() || undefined; // boşsa şema varsayılanı
    const sourceUrl = dto.sourceUrl?.trim() || null;
    const effectiveInfo = dto.effectiveInfo?.trim() || null;

    const row = await this.prisma.lawArticle.upsert({
      where: { topicId_articleNo: { topicId: dto.topicId, articleNo } },
      create: {
        topicId: dto.topicId,
        articleNo,
        text,
        sourceName,
        sourceUrl,
        effectiveInfo,
        status: 'draft',
        createdBy: actor.id,
      },
      update: {
        text,
        sourceName,
        sourceUrl,
        effectiveInfo,
        status: 'draft',
        lastVerifiedAt: null,
        deletedAt: null,
      },
      select: { id: true, status: true, articleNo: true },
    });
    await this.audit.log(actor, 'law_article.upsert', 'law_article', row.id, {
      topicId: dto.topicId,
      articleNo,
    });
    return row;
  }

  /**
   * PDF/metin toplu içe aktarma (panelden — CLI'sız). mevzuat.gov.tr resmî PDF'i
   * yüklenir → metne çevrilir → madde madde bölünür → LawArticle'a yazılır.
   * dryRun ile önce rapor; --all mantığıyla tüm maddeler veya yalnız etiketliler.
   * Yayın yalnız admin (soru onayıyla aynı ilke).
   */
  async importPdf(actor: AuthenticatedUser, topicId: string, opts: ImportLawOptions) {
    if ((opts.publish || opts.force) && !actor.roles.includes('admin')) {
      throw new ForbiddenException(
        'Yayın/üzerine yazma yetkisi admin’dedir; taslak olarak içe aktarabilirsin.',
      );
    }
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, name: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Kanun bulunamadı.');

    const isPdf = opts.filename.toLowerCase().endsWith('.pdf');
    const raw = isPdf ? await extractPdfLawText(opts.buffer) : opts.buffer.toString('utf8');
    const parsedRaw = parseLawText(raw);
    if (parsedRaw.length === 0) {
      throw new BadRequestException(
        'Dosyadan hiç madde çözümlenemedi (satır başında "Madde N –" bekleniyor). PDF resmî konsolide metin mi?',
      );
    }

    // Mükerrer/artık madde no: İLK gövde kazanır (dipnot artıkları gerçek maddeyi
    // ezmesin) — 2559 testinde kanıtlandı.
    const seen = new Set<string>();
    const parsed: typeof parsedRaw = [];
    const duplicates: string[] = [];
    for (const a of parsedRaw) {
      if (seen.has(a.articleNo)) {
        duplicates.push(a.articleNo);
        continue;
      }
      seen.add(a.articleNo);
      parsed.push(a);
    }

    const taggedRows = await this.prisma.question.groupBy({
      by: ['articleNo'],
      where: { topicId: topic.id, deletedAt: null, articleNo: { not: null } },
    });
    const tagged = new Set(taggedRows.map((r) => r.articleNo!));

    const existingRows = await this.prisma.lawArticle.findMany({
      where: { topicId: topic.id, deletedAt: null },
      select: { articleNo: true, status: true },
    });
    const existing = new Map(existingRows.map((r) => [r.articleNo, r.status]));

    const candidates = opts.all ? parsed : parsed.filter((a) => tagged.has(a.articleNo));
    const toWrite: typeof parsed = [];
    const skippedLocked: string[] = [];
    for (const a of candidates) {
      const st = existing.get(a.articleNo);
      // Yayınlanmışı ezme — force ile üzerine yaz (düzeltme/yeniden içe aktarma).
      if (st === 'published' && !opts.force) {
        skippedLocked.push(a.articleNo);
        continue;
      }
      toWrite.push(a);
    }
    const parsedNos = new Set(parsed.map((a) => a.articleNo));
    const missing = [...tagged].filter((no) => !parsedNos.has(no));

    const report = {
      lawName: topic.name,
      parsedCount: parsed.length,
      duplicates,
      taggedCount: tagged.size,
      toWriteCount: toWrite.length,
      skippedPublished: skippedLocked,
      missing,
    };

    if (opts.dryRun) {
      return { ...report, written: 0, published: false, dryRun: true };
    }

    const sourceName = opts.sourceName?.trim() || undefined;
    const sourceUrl = opts.sourceUrl?.trim() || null;
    const effectiveInfo = opts.effectiveInfo?.trim() || null;
    const statusData = opts.publish
      ? ({ status: 'published', lastVerifiedAt: new Date() } as const)
      : ({ status: 'draft', lastVerifiedAt: null } as const);

    let written = 0;
    for (const a of toWrite) {
      await this.prisma.lawArticle.upsert({
        where: { topicId_articleNo: { topicId: topic.id, articleNo: a.articleNo } },
        create: {
          topicId: topic.id,
          articleNo: a.articleNo,
          text: a.text,
          sourceName,
          sourceUrl,
          effectiveInfo,
          createdBy: actor.id,
          ...statusData,
        },
        update: {
          text: a.text,
          sourceName,
          sourceUrl,
          effectiveInfo,
          deletedAt: null,
          ...statusData,
        },
      });
      written += 1;
    }
    await this.audit.log(actor, 'law_article.import', 'law_article', topic.id, {
      written,
      publish: opts.publish,
      all: opts.all,
    });
    return { ...report, written, published: opts.publish, dryRun: false };
  }

  /** Yayınla — YALNIZ admin. Doğrulandı damgası (lastVerifiedAt) atılır. */
  async publish(actor: AuthenticatedUser, id: string) {
    await this.ensureExists(id);
    const row = await this.prisma.lawArticle.update({
      where: { id },
      data: { status: 'published', lastVerifiedAt: new Date() },
      select: { id: true, status: true, lastVerifiedAt: true },
    });
    await this.audit.log(actor, 'law_article.publish', 'law_article', id);
    return row;
  }

  /** Yayından al → taslağa döner, doğrulama damgası silinir. */
  async unpublish(actor: AuthenticatedUser, id: string) {
    await this.ensureExists(id);
    const row = await this.prisma.lawArticle.update({
      where: { id },
      data: { status: 'draft', lastVerifiedAt: null },
      select: { id: true, status: true },
    });
    await this.audit.log(actor, 'law_article.unpublish', 'law_article', id);
    return row;
  }

  /** Sil (soft delete) — YALNIZ admin. */
  async remove(actor: AuthenticatedUser, id: string) {
    await this.ensureExists(id);
    await this.prisma.lawArticle.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log(actor, 'law_article.delete', 'law_article', id);
    return { ok: true };
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.lawArticle.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Madde metni bulunamadı.');
  }
}

/** Madde sıralama anahtarı: sayısal maddeler önce, Ek/Geçici sona (Atlas ile aynı). */
function articleOrder(no: string): number {
  const n = parseInt(no, 10);
  return Number.isNaN(n) ? 10_000 : n;
}
