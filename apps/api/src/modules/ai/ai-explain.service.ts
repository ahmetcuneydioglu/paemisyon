import Anthropic from '@anthropic-ai/sdk';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';

/** Free kullanıcının günlük AI açıklama hakkı (Doc 24 §11). Premium sınırsız. */
const FREE_DAILY_AI_LIMIT = 3;

const MODEL = 'claude-opus-4-8';

/**
 * AI yanlış açıklaması (Doc 24 §4 Faz 2 — en yüksek algılanan değer / en düşük
 * risk). İlkeler:
 * - ÖNBELLEK-ÖNCE: aynı sürüm+şık için bir kez üretilir, herkese servis edilir.
 * - AI soru YAZMAZ; yalnız mevcut kaynaklı soruyu AÇIKLAR (CLAUDE.md kuralı).
 * - Kullanıcı bu soruyu gerçekten cevaplamış olmalı (banka sızdırma korunur).
 * - Ton: Doc 26 §1 — suçlama yok, kısa, 'sen' dili, çeldirici analizi.
 */
@Injectable()
export class AiExplainService {
  private readonly logger = new Logger(AiExplainService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.ANTHROPIC_API_KEY;
    this.client = key ? new Anthropic({ apiKey: key }) : null;
    if (!key) {
      this.logger.warn(
        'ANTHROPIC_API_KEY tanımlı değil — AI açıklama ucu 503 dönecek (kurulum: Railway Variables).',
      );
    }
  }

  async explain(
    user: AuthenticatedUser,
    versionId: string,
    chosenOptionId: string,
  ): Promise<{ text: string; cached: boolean; remainingToday: number | null }> {
    // 1) Sürüm + şıklar (doğru işaretli — sunucuda kalır, istemciye gitmez).
    const version = await this.prisma.questionVersion.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        stem: true,
        explanation: true,
        sourceLabel: true,
        question: { select: { deletedAt: true } },
        options: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, label: true, text: true, isCorrect: true },
        },
      },
    });
    if (!version || version.question.deletedAt) {
      throw new NotFoundException('Soru bulunamadı.');
    }
    const chosen = version.options.find((o) => o.id === chosenOptionId);
    if (!chosen) throw new BadRequestException('Geçersiz şık.');

    // 2) Kullanıcı bu soruyu gerçekten cevapladı mı? (banka sızdırma korunur)
    const answered = await this.prisma.quizAnswer.findFirst({
      where: {
        questionVersionId: versionId,
        session: { userId: user.id },
        selectedOptionId: { not: null },
      },
      select: { id: true },
    });
    if (!answered) {
      throw new ForbiddenException('Bu soruyu önce cevaplamalısın.');
    }

    // 3) Önbellek — varsa hak DÜŞMEZ (kullanıcıya maliyetsiz).
    const cachedRow = await this.prisma.aiExplanation.findUnique({
      where: {
        questionVersionId_chosenOptionId: {
          questionVersionId: versionId,
          chosenOptionId,
        },
      },
    });
    if (cachedRow) {
      return { text: cachedRow.text, cached: true, remainingToday: null };
    }

    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI açıklama şu an yapılandırılmadı. (Sunucuya ANTHROPIC_API_KEY eklenmeli.)',
      );
    }

    // 4) Free günlük hak (atomik; premium bypass) — yalnız CANLI üretimde düşer.
    let remainingToday: number | null = null;
    if (!user.isPremium) {
      remainingToday = await this.consumeDailyQuota(user.id);
    }

    // 5) Üret + önbelleğe yaz.
    const text = await this.generate(version, chosen.id);
    await this.prisma.aiExplanation.upsert({
      where: {
        questionVersionId_chosenOptionId: {
          questionVersionId: versionId,
          chosenOptionId,
        },
      },
      update: {},
      create: { questionVersionId: versionId, chosenOptionId, text, model: MODEL },
    });
    return { text, cached: false, remainingToday };
  }

  /** Günlük hakkı atomik düşür; hak yoksa premium teklifi fırlat. */
  private async consumeDailyQuota(userId: string): Promise<number> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const rows = await this.prisma.$queryRaw<{ ai_explanations_used: number }[]>`
      UPDATE daily_usage SET ai_explanations_used = ai_explanations_used + 1
      WHERE user_id = ${userId}::uuid AND usage_date = ${today}
        AND ai_explanations_used < ${FREE_DAILY_AI_LIMIT}
      RETURNING ai_explanations_used`;
    if (rows.length === 0) {
      // Satır yoksa (bugün hiç soru çözülmemiş olabilir) oluşturmayı dene.
      const created = await this.prisma.$queryRaw<{ ai_explanations_used: number }[]>`
        INSERT INTO daily_usage (user_id, usage_date, questions_answered, daily_limit, ai_explanations_used)
        VALUES (${userId}::uuid, ${today}, 0, 15, 1)
        ON CONFLICT (user_id, usage_date) DO NOTHING
        RETURNING ai_explanations_used`;
      if (created.length === 0) {
        throw new ForbiddenException({
          code: 'AI_LIMIT_REACHED',
          message: `Bugünkü ${FREE_DAILY_AI_LIMIT} AI açıklama hakkın doldu. Premium'da sınırsız.`,
        });
      }
      return FREE_DAILY_AI_LIMIT - created[0].ai_explanations_used;
    }
    return FREE_DAILY_AI_LIMIT - rows[0].ai_explanations_used;
  }

  private async generate(
    version: {
      stem: string;
      explanation: string | null;
      sourceLabel: string | null;
      options: { id: string; label: string; text: string; isCorrect: boolean }[];
    },
    chosenId: string,
  ): Promise<string> {
    const correct = version.options.find((o) => o.isCorrect);
    const chosen = version.options.find((o) => o.id === chosenId)!;
    const optionsText = version.options
      .map((o) => `${o.label}) ${o.text}${o.isCorrect ? ' [DOĞRU CEVAP]' : ''}`)
      .join('\n');

    const system = [
      'Sen Paemisyon uygulamasının koçusun: polis sınavına hazırlanan bir',
      'meslektaşına, az önce yanlış cevapladığı soruyu açıklıyorsun.',
      'KURALLAR: (1) En fazla 120 kelime, 2-3 kısa paragraf. (2) Önce doğru',
      "cevabın NEDEN doğru olduğunu, sonra kullanıcının seçtiği şıkkın neden",
      'çekici ama yanlış olduğunu (çeldirici analizi) anlat. (3) Tek cümlelik',
      "akılda tutma kancasıyla bitir. (4) 'Sen' dili; suçlama ve 'maalesef' yok.",
      '(5) Mevzuat sorusuysa dayandığı madde/kuralı bir kez an. (6) Başlık,',
      'madde imi, emoji kullanma — düz paragraf yaz. (7) Soru metni dışında',
      'hukuki bilgi uydurma; emin olmadığın ayrıntıya girme.',
    ].join(' ');

    const userMsg = [
      `SORU: ${version.stem}`,
      '',
      'ŞIKLAR:',
      optionsText,
      '',
      `KULLANICININ SEÇİMİ: ${chosen.label}) ${chosen.text}`,
      correct ? `DOĞRU CEVAP: ${correct.label}) ${correct.text}` : '',
      version.explanation ? `\nEDİTÖR AÇIKLAMASI (tutarlı kal): ${version.explanation}` : '',
      version.sourceLabel ? `KAYNAK: ${version.sourceLabel}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const res = await this.client!.messages.create({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: userMsg }],
      });
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      if (!text) throw new Error('empty response');
      return text;
    } catch (e) {
      this.logger.error(`AI açıklama üretilemedi: ${String(e)}`);
      throw new ServiceUnavailableException(
        'AI açıklama şu an üretilemiyor — birazdan tekrar dene.',
      );
    }
  }
}
