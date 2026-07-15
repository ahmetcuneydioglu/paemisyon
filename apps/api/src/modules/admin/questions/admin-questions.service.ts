import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ContentStatus, Difficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { UpsertQuestionDto } from '../dto/upsert-question.dto';
import {
  parseImportFile,
  questionFingerprint,
  suggestTopic,
  type RowError,
} from './import-parser';

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

    // Konu değiştirilebilir (Doc 20): panel dropdown'ı önceden sessizce yok
    // sayılıyordu. Yeni hedef konu geçerli olmalı.
    const topicChanged = dto.topicId !== q.topicId;
    if (topicChanged) {
      const topic = await this.prisma.topic.findFirst({
        where: { id: dto.topicId, deletedAt: null },
      });
      if (!topic) throw new BadRequestException('Hedef konu bulunamadı.');
    }

    await this.prisma.$transaction(async (tx) => {
      if (topicChanged) {
        await tx.question.update({ where: { id }, data: { topicId: dto.topicId } });
      }
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

  // ── Onay kuyruğu özeti: konu bazında bekleyen sayıları (panel için) ──
  async reviewSummary() {
    const groups = await this.prisma.questionVersion.groupBy({
      by: ['questionId'],
      where: { status: 'in_review', question: { deletedAt: null } },
    });
    const questionIds = groups.map((g) => g.questionId);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        topicId: true,
        topic: { select: { name: true, course: { select: { name: true } } } },
      },
    });
    const byTopic = new Map<string, { topicId: string; topicName: string; courseName: string; count: number }>();
    for (const q of questions) {
      const cur = byTopic.get(q.topicId) ?? {
        topicId: q.topicId,
        topicName: q.topic.name,
        courseName: q.topic.course.name,
        count: 0,
      };
      cur.count++;
      byTopic.set(q.topicId, cur);
    }
    return [...byTopic.values()].sort((a, b) => b.count - a.count);
  }

  // ── Toplu onay (Doc 9 §4.1 "toplu işlem"): bir konudaki TÜM in_review sorular ──
  // YALNIZCA admin çağırır (controller'da). Yayın kontrolü tek tek uygulanır:
  // tam bir doğru şıkkı olmayan soru atlanır ve raporlanır — sessiz geçiş yok.
  async bulkApprove(actor: AuthenticatedUser, topicId: string) {
    const topic = await this.prisma.topic.findFirst({
      where: { id: topicId, deletedAt: null },
      select: { name: true },
    });
    if (!topic) throw new NotFoundException('Konu bulunamadı.');

    const versions = await this.prisma.questionVersion.findMany({
      where: { status: 'in_review', question: { topicId, deletedAt: null } },
      include: { options: { select: { isCorrect: true } } },
      orderBy: { createdAt: 'asc' },
    });

    let approved = 0;
    const skipped: { questionId: string; reason: string }[] = [];
    const CHUNK = 25;
    for (let i = 0; i < versions.length; i += CHUNK) {
      const chunk = versions.slice(i, i + CHUNK);
      await this.prisma.$transaction(
        async (tx) => {
          for (const v of chunk) {
            if (v.options.filter((o) => o.isCorrect).length !== 1) {
              skipped.push({ questionId: v.questionId, reason: 'Tam bir doğru şık işaretli değil.' });
              continue;
            }
            await tx.questionVersion.updateMany({
              where: { questionId: v.questionId, status: 'published' },
              data: { status: 'archived', archivedAt: new Date() },
            });
            await tx.questionVersion.update({
              where: { id: v.id },
              data: { status: 'published', publishedAt: new Date(), reviewedBy: actor.id },
            });
            await tx.question.update({
              where: { id: v.questionId },
              data: { currentVersionId: v.id },
            });
            approved++;
          }
        },
        { timeout: 120_000, maxWait: 30_000 },
      );
    }

    await this.audit.log(actor, 'question.bulk_approve', 'topic', topicId, {
      topicName: topic.name,
      approved,
      skipped: skipped.length,
    });
    return { topicId, topicName: topic.name, approved, skipped };
  }

  // ── Toplu içe aktarma (Doc 9 §4.4) ──
  // KURAL: içe aktarılan sorular ASLA doğrudan yayına çıkmaz — in_review kuyruğuna
  // düşer (eski sistemin doğrudan-yayın hatası bilinçli olarak tekrarlanmaz).
  // ── Toplu içe aktarma: ÖNİZLEME (parse + satır başına konu önerisi) ──
  // Sorular tek konuya değil, satır başına konuya atanır (Doc 20). moduleId
  // kapsamındaki konular matchKeywords'e göre önerilir; admin sınıflandırma
  // ekranında onaylar/düzeltir. Hiçbir şey yazılmaz.
  async previewImport(params: { moduleId: string; file: Buffer; filename: string }) {
    const module = await this.prisma.module.findFirst({ where: { id: params.moduleId } });
    if (!module) throw new BadRequestException('Hedef modül bulunamadı.');

    const report = await parseImportFile(params.file, params.filename);
    if (report.totalRows > IMPORT_MAX_ROWS) {
      throw new BadRequestException(
        `Dosya en fazla ${IMPORT_MAX_ROWS} satır içerebilir (${report.totalRows} bulundu). Dosyayı bölerek yükle.`,
      );
    }

    const topics = await this.moduleTopics(params.moduleId);

    // Tekrar (mükerrer) tespiti (Doc 20 EK 2): parmak izi hesapla, bankaya ve
    // aynı dosyaya (batch) karşı kontrol et.
    const fingerprints = report.valid.map((row) =>
      questionFingerprint(row.stem, row.options.map((o) => o.text)),
    );
    const bankLocation = await this.duplicateLocations(fingerprints);
    const seenInBatch = new Map<string, number>(); // hash -> ilk rowNo

    const valid = report.valid.map((row, i) => {
      const s = suggestTopic(row.stem, topics);
      const hash = fingerprints[i];
      let duplicate: { scope: 'bank' | 'batch'; where: string } | null = null;
      if (bankLocation.has(hash)) {
        duplicate = { scope: 'bank', where: bankLocation.get(hash)! };
      } else if (seenInBatch.has(hash)) {
        duplicate = { scope: 'batch', where: `bu dosyada #${seenInBatch.get(hash)} ile aynı` };
      }
      if (!seenInBatch.has(hash)) seenInBatch.set(hash, row.rowNo);
      return {
        ...row,
        suggestedTopicId: s?.id ?? null,
        suggestedTopicName: s?.name ?? null,
        matchedKeyword: s?.matchedKeyword ?? null,
        duplicate,
      };
    });

    return {
      totalRows: report.totalRows,
      valid,
      errors: report.errors,
      detectedSource: report.detectedSource ?? null,
      // Sınıflandırma dropdown'ları için (ayrı istek gerekmesin).
      moduleTopics: topics.map((t) => ({ id: t.id, name: t.name, courseName: t.courseName })),
    };
  }

  // ── Toplu içe aktarma: UYGULA (satır→konu eşlemesiyle) ──
  // assignments TÜM geçerli satırları kapsamalı; her konu bu modülde olmalı.
  async import(
    actor: AuthenticatedUser,
    params: {
      moduleId: string;
      file: Buffer;
      filename: string;
      /// rowNo -> topicId (admin'in onayladığı sınıflandırma).
      assignments: Record<number, string>;
      /// Aktarımdan çıkarılan sorular (rowNo) — DB'ye HİÇ yazılmaz (Doc 20 ek).
      excluded?: number[];
      skipErrors: boolean;
      /// Kaynak etiketi; boşsa PDF'ten saptanan öneri kullanılır.
      sourceLabel?: string;
    },
  ): Promise<{ imported: number; errors: RowError[]; skipped: number; excluded: number }> {
    const topics = await this.moduleTopics(params.moduleId);
    const topicIds = new Set(topics.map((t) => t.id));

    const report = await parseImportFile(params.file, params.filename);
    if (report.valid.length === 0) {
      throw new BadRequestException('Aktarılacak geçerli soru yok.');
    }
    if (report.errors.length > 0 && !params.skipErrors) {
      throw new BadRequestException(
        `${report.errors.length} hatalı satır var. Düzeltip yeniden yükle ya da hatalıları atla.`,
      );
    }

    // Her geçerli satır KARAR verilmiş olmalı: konuya atanmış VEYA çıkarılmış.
    // Çıkarma önceliklidir (atanmış ama çıkarılmışsa yazılmaz).
    const excludedSet = new Set(params.excluded ?? []);
    const undecided = report.valid.filter(
      (r) => !params.assignments[r.rowNo] && !excludedSet.has(r.rowNo),
    );
    if (undecided.length > 0) {
      throw new BadRequestException(
        `${undecided.length} soru ne sınıflandırıldı ne çıkarıldı. Her soruya konu ata ya da çıkar.`,
      );
    }
    // Yazılacaklar: konuya atanmış ve çıkarılmamış olanlar.
    const toWrite = report.valid.filter(
      (r) => params.assignments[r.rowNo] && !excludedSet.has(r.rowNo),
    );
    if (toWrite.length === 0) {
      throw new BadRequestException('Aktarılacak soru kalmadı (hepsi çıkarıldı).');
    }
    for (const r of toWrite) {
      if (!topicIds.has(params.assignments[r.rowNo])) {
        throw new BadRequestException(`Geçersiz konu ataması (soru ${r.rowNo}).`);
      }
    }

    const sourceLabel = params.sourceLabel?.trim() || report.detectedSource || null;
    // ID'ler istemcide üretilir → satır başına create yerine 3 toplu INSERT.
    // (Satır başına 2 sorgu, 80 soruda uzak DB gecikmesiyle Prisma'nın 5 sn
    // transaction sınırını aşıyordu — canlıda yaşandı.)
    const rowsToInsert = toWrite.map((row) => ({
      row,
      questionId: randomUUID(),
      versionId: randomUUID(),
      contentHash: questionFingerprint(row.stem, row.options.map((o) => o.text)),
    }));
    await this.prisma.$transaction(async (tx) => {
      await tx.question.createMany({
        data: rowsToInsert.map((r) => ({
          id: r.questionId,
          topicId: params.assignments[r.row.rowNo],
        })),
      });
      await tx.questionVersion.createMany({
        data: rowsToInsert.map((r) => ({
          id: r.versionId,
          questionId: r.questionId,
          versionNo: 1,
          stem: r.row.stem,
          explanation: r.row.explanation,
          sourceLabel,
          contentHash: r.contentHash,
          difficulty: r.row.difficulty as Difficulty,
          status: 'in_review' as const, // onay kuyruğuna düşer — doğrudan yayın YOK
          authoredBy: actor.id,
        })),
      });
      await tx.questionOption.createMany({
        data: rowsToInsert.flatMap((r) =>
          r.row.options.map((o, i) => ({
            questionVersionId: r.versionId,
            label: o.label,
            text: o.text,
            isCorrect: o.isCorrect,
            sortOrder: i,
          })),
        ),
      });
    });

    // Konu bazında dağılımı audit'e yaz (hangi konuya kaç soru).
    const byTopic: Record<string, number> = {};
    for (const r of toWrite) {
      const name = topics.find((t) => t.id === params.assignments[r.rowNo])!.name;
      byTopic[name] = (byTopic[name] ?? 0) + 1;
    }
    await this.audit.log(actor, 'question.import', 'module', params.moduleId, {
      filename: params.filename,
      imported: toWrite.length,
      excludedCount: excludedSet.size,
      errorCount: report.errors.length,
      byTopic,
      sourceLabel,
    });
    return {
      imported: toWrite.length,
      errors: report.errors,
      skipped: report.errors.length,
      excluded: excludedSet.size,
    };
  }

  // Modül kapsamındaki konular + keyword'ler + ders adı (öneri/atama için).
  private async moduleTopics(moduleId: string) {
    const topics = await this.prisma.topic.findMany({
      where: { deletedAt: null, course: { moduleId, deletedAt: null } },
      select: {
        id: true,
        name: true,
        matchKeywords: true,
        course: { select: { name: true } },
      },
      orderBy: [{ course: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
    return topics.map((t) => ({
      id: t.id,
      name: t.name,
      matchKeywords: t.matchKeywords,
      courseName: t.course.name,
    }));
  }

  // Bankada bu parmak izlerine sahip (silinmemiş) soruların konumu (Doc 20 EK 2).
  // hash → "Ders / Konu" (kullanıcıya nerede olduğunu göstermek için).
  private async duplicateLocations(hashes: string[]): Promise<Map<string, string>> {
    const uniq = [...new Set(hashes.filter(Boolean))];
    if (uniq.length === 0) return new Map();
    const rows = await this.prisma.questionVersion.findMany({
      where: { contentHash: { in: uniq }, question: { deletedAt: null } },
      select: {
        contentHash: true,
        question: { select: { topic: { select: { name: true, course: { select: { name: true } } } } } },
      },
    });
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.contentHash && !map.has(r.contentHash)) {
        map.set(r.contentHash, `${r.question.topic.course.name} / ${r.question.topic.name}`);
      }
    }
    return map;
  }

  // ── Konu değiştir (toplu): sınıflandırma düzeltmesi (Doc 20 §3) ──
  async bulkSetTopic(
    actor: AuthenticatedUser,
    params: { questionIds: string[]; topicId: string },
  ): Promise<{ updated: number }> {
    const topic = await this.prisma.topic.findFirst({
      where: { id: params.topicId, deletedAt: null },
    });
    if (!topic) throw new BadRequestException('Hedef konu bulunamadı.');
    const result = await this.prisma.question.updateMany({
      where: { id: { in: params.questionIds }, deletedAt: null },
      data: { topicId: params.topicId },
    });
    await this.audit.log(actor, 'question.bulk_set_topic', 'topic', params.topicId, {
      count: result.count,
      topicName: topic.name,
    });
    return { updated: result.count };
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
