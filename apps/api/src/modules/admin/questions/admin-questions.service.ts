import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ContentStatus, Difficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UpsertQuestionDto } from '../dto/upsert-question.dto';
import { parseImportFile, type ParseReport } from './import-parser';

const IMPORT_MAX_ROWS = 500;

/**
 * Soru yönetimi + editoryal onay (Doc 9 §4 — panelin kalbi).
 * Kural: YAYINDAKİ SÜRÜM ASLA DÜZENLENMEZ. Düzenleme = yeni taslak sürüm.
 * Akış: draft → in_review → (approve) published / (reject) draft.
 * Yayında eski sürüm arşivlenir; kullanıcıların eski cevapları bozulmaz.
 */
@Injectable()
export class AdminQuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Liste (filtre: durum/konu/arama — Doc 9 §4.1) ──
  async list(params: {
    status?: ContentStatus;
    topicId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

    // Filtre "sorunun en güncel sürümü" üstünden: durum/arama sürümlerde aranır.
    const versionFilter: Prisma.QuestionVersionWhereInput = {};
    if (params.status) versionFilter.status = params.status;
    if (params.search) versionFilter.stem = { contains: params.search, mode: 'insensitive' };

    const where: Prisma.QuestionWhereInput = {
      deletedAt: null,
      ...(params.topicId ? { topicId: params.topicId } : {}),
      ...(params.status || params.search ? { versions: { some: versionFilter } } : {}),
    };

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          topic: { select: { name: true, course: { select: { name: true } } } },
          versions: { orderBy: { versionNo: 'desc' }, take: 1, select: { versionNo: true, stem: true, status: true, createdAt: true } },
          currentVersion: { select: { versionNo: true, status: true } },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items: questions.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        topicName: q.topic.name,
        courseName: q.topic.course.name,
        latestVersion: q.versions[0] ?? null,
        publishedVersionNo: q.currentVersion?.versionNo ?? null,
        createdAt: q.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  // ── Detay: tüm sürümler + seçenekler ──
  async detail(id: string) {
    const q = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: {
        topic: { select: { id: true, name: true, course: { select: { id: true, name: true } } } },
        versions: {
          orderBy: { versionNo: 'desc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
            legalReferences: true,
          },
        },
      },
    });
    if (!q) throw new NotFoundException('Soru bulunamadı.');
    return { ...q, currentVersionId: q.currentVersionId };
  }

  // ── Oluştur: soru + v1 taslak (Doc 9 §4.2) ──
  async create(actor: AuthenticatedUser, dto: UpsertQuestionDto) {
    this.validateOptions(dto);
    const question = await this.prisma.$transaction(async (tx) => {
      const q = await tx.question.create({ data: { topicId: dto.topicId } });
      await this.createVersion(tx, q.id, 1, actor.id, dto);
      return q;
    });
    await this.audit.log(actor, 'question.create', 'question', question.id, { topicId: dto.topicId });
    return this.detail(question.id);
  }

  // ── Düzenle: taslak varsa güncelle, yoksa YENİ taslak sürüm aç (yayındaki bozulmaz) ──
  async update(actor: AuthenticatedUser, id: string, dto: UpsertQuestionDto) {
    this.validateOptions(dto);
    const q = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } },
    });
    if (!q) throw new NotFoundException('Soru bulunamadı.');
    const latest = q.versions[0];

    await this.prisma.$transaction(async (tx) => {
      if (latest && (latest.status === 'draft' || latest.status === 'in_review')) {
        // Taslak/incelemedeki sürüm yerinde güncellenir (sürüm şişmesin).
        await tx.questionOption.deleteMany({ where: { questionVersionId: latest.id } });
        await tx.questionVersion.update({
          where: { id: latest.id },
          data: {
            stem: dto.stem,
            explanation: dto.explanation ?? null,
            difficulty: (dto.difficulty ?? 'medium') as Difficulty,
            status: 'draft', // in_review'da düzenleme onayı sıfırlar
            options: {
              create: dto.options.map((o, i) => ({
                label: o.label,
                text: o.text,
                isCorrect: o.isCorrect,
                sortOrder: i,
              })),
            },
          },
        });
      } else {
        await this.createVersion(tx, id, (latest?.versionNo ?? 0) + 1, actor.id, dto);
      }
    });
    await this.audit.log(actor, 'question.update', 'question', id);
    return this.detail(id);
  }

  // ── İncelemeye gönder: draft → in_review ──
  async submitForReview(actor: AuthenticatedUser, id: string) {
    const version = await this.latestVersionOrThrow(id);
    if (version.status !== 'draft') {
      throw new BadRequestException('Yalnızca taslak sürüm incelemeye gönderilebilir.');
    }
    await this.prisma.questionVersion.update({
      where: { id: version.id },
      data: { status: 'in_review' },
    });
    await this.audit.log(actor, 'question.submit_review', 'question', id, { versionNo: version.versionNo });
    return this.detail(id);
  }

  // ── Onayla: in_review → published; eski yayın arşivlenir (Doc 9 §4.3) ──
  async approve(actor: AuthenticatedUser, id: string) {
    const version = await this.latestVersionOrThrow(id, { includeOptions: true });
    if (version.status !== 'in_review') {
      throw new BadRequestException('Yalnızca incelemedeki sürüm onaylanabilir.');
    }
    // Yayın öncesi zorunlu kontrol: tam bir doğru cevap işaretli olmalı.
    const correctCount = version.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException('Yayın için tam bir doğru cevap işaretli olmalı.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Eski yayındaki sürümü arşivle.
      await tx.questionVersion.updateMany({
        where: { questionId: id, status: 'published' },
        data: { status: 'archived', archivedAt: new Date() },
      });
      await tx.questionVersion.update({
        where: { id: version.id },
        data: { status: 'published', publishedAt: new Date(), reviewedBy: actor.id },
      });
      await tx.question.update({ where: { id }, data: { currentVersionId: version.id } });
    });
    await this.audit.log(actor, 'question.approve', 'question', id, { versionNo: version.versionNo });
    return this.detail(id);
  }

  // ── Reddet: in_review → draft (not audit'e yazılır) ──
  async reject(actor: AuthenticatedUser, id: string, note?: string) {
    const version = await this.latestVersionOrThrow(id);
    if (version.status !== 'in_review') {
      throw new BadRequestException('Yalnızca incelemedeki sürüm reddedilebilir.');
    }
    await this.prisma.questionVersion.update({
      where: { id: version.id },
      data: { status: 'draft' },
    });
    await this.audit.log(actor, 'question.reject', 'question', id, {
      versionNo: version.versionNo,
      note: note ?? null,
    });
    return this.detail(id);
  }

  // ── Arşivle (soft): soru yayından kalkar ──
  async archive(actor: AuthenticatedUser, id: string) {
    const q = await this.prisma.question.findFirst({ where: { id, deletedAt: null } });
    if (!q) throw new NotFoundException('Soru bulunamadı.');
    await this.prisma.$transaction(async (tx) => {
      await tx.questionVersion.updateMany({
        where: { questionId: id, status: 'published' },
        data: { status: 'archived', archivedAt: new Date() },
      });
      await tx.question.update({
        where: { id },
        data: { currentVersionId: null, deletedAt: new Date() },
      });
    });
    await this.audit.log(actor, 'question.archive', 'question', id);
    return { archived: true };
  }

  // ── Toplu içe aktarma (Doc 9 §4.4) ──
  // KURAL: içe aktarılan sorular ASLA doğrudan yayına çıkmaz — in_review kuyruğuna
  // düşer (eski sistemin doğrudan-yayın hatası bilinçli olarak tekrarlanmaz).
  async import(
    actor: AuthenticatedUser,
    params: { topicId: string; file: Buffer; filename: string; dryRun: boolean; skipErrors: boolean },
  ): Promise<ParseReport & { imported: number; dryRun: boolean }> {
    const topic = await this.prisma.topic.findFirst({
      where: { id: params.topicId, deletedAt: null },
    });
    if (!topic) throw new BadRequestException('Hedef konu bulunamadı.');

    const report = await parseImportFile(params.file, params.filename);
    if (report.totalRows > IMPORT_MAX_ROWS) {
      throw new BadRequestException(
        `Dosya en fazla ${IMPORT_MAX_ROWS} satır içerebilir (${report.totalRows} bulundu). Dosyayı bölerek yükle.`,
      );
    }

    if (params.dryRun) {
      return { ...report, imported: 0, dryRun: true };
    }
    if (report.errors.length > 0 && !params.skipErrors) {
      // Varsayılan: hata varsa HİÇBİR şey aktarılmaz (yarım aktarım + tekrar
      // yüklemede mükerrer kayıt karmaşası olmasın). skipErrors bilinçli tercihtir.
      return { ...report, imported: 0, dryRun: false };
    }
    if (report.valid.length === 0) {
      return { ...report, imported: 0, dryRun: false };
    }

    await this.prisma.$transaction(async (tx) => {
      for (const row of report.valid) {
        const q = await tx.question.create({ data: { topicId: params.topicId } });
        await tx.questionVersion.create({
          data: {
            questionId: q.id,
            versionNo: 1,
            stem: row.stem,
            explanation: row.explanation,
            difficulty: row.difficulty as Difficulty,
            status: 'in_review', // onay kuyruğuna düşer — doğrudan yayın YOK
            authoredBy: actor.id,
            options: {
              create: row.options.map((o, i) => ({
                label: o.label,
                text: o.text,
                isCorrect: o.isCorrect,
                sortOrder: i,
              })),
            },
          },
        });
      }
    });

    await this.audit.log(actor, 'question.import', 'topic', params.topicId, {
      filename: params.filename,
      imported: report.valid.length,
      errorCount: report.errors.length,
      topicName: topic.name,
    });
    return { ...report, imported: report.valid.length, dryRun: false };
  }

  // ── Yardımcılar ──
  private validateOptions(dto: UpsertQuestionDto) {
    if (dto.options.length < 2 || dto.options.length > 5) {
      throw new BadRequestException('Soru 2-5 arası şık içermeli.');
    }
    const correct = dto.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) {
      throw new BadRequestException('Tam bir doğru şık işaretlenmeli.');
    }
  }

  private async createVersion(
    tx: Prisma.TransactionClient,
    questionId: string,
    versionNo: number,
    authorId: string,
    dto: UpsertQuestionDto,
  ) {
    return tx.questionVersion.create({
      data: {
        questionId,
        versionNo,
        stem: dto.stem,
        explanation: dto.explanation ?? null,
        difficulty: (dto.difficulty ?? 'medium') as Difficulty,
        status: 'draft',
        authoredBy: authorId,
        options: {
          create: dto.options.map((o, i) => ({
            label: o.label,
            text: o.text,
            isCorrect: o.isCorrect,
            sortOrder: i,
          })),
        },
      },
    });
  }

  private async latestVersionOrThrow(questionId: string, opts?: { includeOptions?: boolean }) {
    const version = await this.prisma.questionVersion.findFirst({
      where: { questionId, question: { deletedAt: null } },
      orderBy: { versionNo: 'desc' },
      include: { options: opts?.includeOptions ?? false },
    });
    if (!version) throw new NotFoundException('Soru bulunamadı.');
    return version as typeof version & { options: { isCorrect: boolean }[] };
  }
}
