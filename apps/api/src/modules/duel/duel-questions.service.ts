import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { IPTAL_EDILMEMIS } from '../../common/iptal-soru';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { DUEL_RULES } from './duel.config';

export type DuelScopeKind = 'mixed' | 'course' | 'topic';
export interface DuelScope {
  kind: DuelScopeKind;
  id: string | null;
}

export interface PickedQuestion {
  questionVersionId: string;
  correctOptionId: string;
}

/**
 * Düello soru seti (Doc 59 §soru bankası). YENİ SORU ÜRETİLMEZ: yalnız bankadaki yayında,
 * iptal edilmemiş, premium olmayan, tam beş şıklı ve tek doğru cevaplı sorular girer.
 * Süreli yarışma olduğu için uzun kök/şık elenir (`maxQuestionChars`).
 */
@Injectable()
export class DuelQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Kapsam bu modülde geçerli mi? Ekranda gösterilecek adı döner. */
  async scopeLabel(moduleId: string, scope: DuelScope): Promise<string> {
    if (scope.kind === 'mixed') return 'Karışık';
    if (!scope.id) throw new BadRequestException('Konu seçimi eksik.');
    const dersFiltresi = {
      deletedAt: null,
      sections: { some: { section: { deletedAt: null, examTypeId: moduleId } } },
    } satisfies Prisma.CourseWhereInput;
    if (scope.kind === 'course') {
      const c = await this.prisma.course.findFirst({
        where: { id: scope.id, ...dersFiltresi },
        select: { name: true },
      });
      if (!c) throw new BadRequestException('Bu ders sınavının müfredatında yok.');
      return c.name;
    }
    const t = await this.prisma.topic.findFirst({
      where: { id: scope.id, deletedAt: null, course: dersFiltresi },
      select: { name: true },
    });
    if (!t) throw new BadRequestException('Bu konu sınavının müfredatında yok.');
    return t.name;
  }

  private where(moduleId: string, scope: DuelScope): Prisma.QuestionWhereInput {
    return {
      deletedAt: null,
      currentVersionId: { not: null },
      ...IPTAL_EDILMEMIS,
      currentVersion: { status: 'published' },
      topic: {
        deletedAt: null,
        isPremium: false,
        ...(scope.kind === 'topic' && scope.id
          ? { OR: [{ id: scope.id }, { parentId: scope.id }] }
          : {}),
        course: {
          deletedAt: null,
          ...(scope.kind === 'course' && scope.id ? { id: scope.id } : {}),
          sections: { some: { section: { deletedAt: null, examTypeId: moduleId } } },
        },
      },
    };
  }

  /**
   * `count` soruyu rastgele seçer. Havuz yetmezse açık bir hata döner (maç kurulmaz).
   * Aynı konudan yığılmayı önlemek için karışık kapsamda konu başına tavan uygulanır.
   */
  async pick(moduleId: string, scope: DuelScope, count: number): Promise<PickedQuestion[]> {
    const pool = await this.prisma.question.findMany({
      where: this.where(moduleId, scope),
      select: { currentVersionId: true, topicId: true },
    });
    // Fisher–Yates (kriptografik rastgelelik: soru sırası tahmin edilemesin)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const konuTavani = scope.kind === 'mixed' ? Math.max(2, Math.ceil(count / 5)) : count;
    const konuSayaci = new Map<string, number>();
    const secilen: PickedQuestion[] = [];
    const PARTI = count * 4;

    for (let bas = 0; bas < pool.length && secilen.length < count; bas += PARTI) {
      const parti = pool.slice(bas, bas + PARTI);
      const surumler = await this.prisma.questionVersion.findMany({
        where: { id: { in: parti.map((p) => p.currentVersionId!) } },
        select: {
          id: true,
          stem: true,
          options: { select: { id: true, text: true, isCorrect: true } },
        },
      });
      const byId = new Map(surumler.map((s) => [s.id, s]));
      for (const p of parti) {
        if (secilen.length >= count) break;
        const v = byId.get(p.currentVersionId!);
        if (!v) continue;
        const dogrular = v.options.filter((o) => o.isCorrect);
        if (v.options.length !== 5 || dogrular.length !== 1) continue;
        const uzunluk = v.stem.length + v.options.reduce((n, o) => n + o.text.length, 0);
        if (uzunluk > DUEL_RULES.maxQuestionChars) continue;
        const n = konuSayaci.get(p.topicId) ?? 0;
        if (n >= konuTavani) continue;
        konuSayaci.set(p.topicId, n + 1);
        secilen.push({ questionVersionId: v.id, correctOptionId: dogrular[0].id });
      }
    }

    if (secilen.length < count) {
      throw new ConflictException(
        scope.kind === 'mixed'
          ? 'Düello için yeterli soru bulunamadı. Biraz sonra tekrar dene.'
          : `Bu seçimde düelloya uygun yeterli soru yok (${secilen.length}/${count}). Başka bir konu ya da "Karışık" seç.`,
      );
    }
    return secilen;
  }
}
