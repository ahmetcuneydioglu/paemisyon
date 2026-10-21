import { Prisma } from '@prisma/client';
import { articleSlug, slugify } from '../public/public.service';

/**
 * Tur sorusu sözleşmesi (F10-0, Doc 49/15): istemciye giden soru özeti.
 * Şıklarda doğru anahtarı YOKTUR; `explanation`/`isCorrect` hiç seçilmez.
 * `difficulty` ve madde bağı ekran üstü meta satırı içindir; madde bağı
 * yalnız ALIŞTIRMA türü turlarda döner (denemede ipucu olur — kullanıcı
 * kararı, 22 Eki 2026). Madde METNİ burada yok: cevaptan önce okuyucu
 * (`/public/mevzuat/:slug/oku`) açılır, cevaptan sonra metin geri bildirimle gelir.
 */
export const SORU_OZETI_SELECT = {
  id: true,
  questionId: true,
  stem: true,
  mediaUrl: true,
  difficulty: true,
  options: {
    select: { id: true, label: true, text: true }, // anahtar sızmaz
    orderBy: { sortOrder: 'asc' },
  },
  question: {
    select: {
      articleNo: true,
      topic: { select: { name: true, legislation: { select: { slug: true, shortName: true } } } },
    },
  },
} satisfies Prisma.QuestionVersionSelect;

export type SoruSurumu = Prisma.QuestionVersionGetPayload<{ select: typeof SORU_OZETI_SELECT }>;

export interface MaddeBagi {
  /** Feedback'teki `relatedArticle.lawSlug` ile aynı türetim (konu adından). */
  lawSlug: string;
  no: string;
  slug: string;
  /** Ekran etiketi: "PVSK md. 4/A" (kısa ad yoksa konu adı). */
  label: string;
  /** Mevzuat okuyucu slug'ı (`/public/mevzuat/:slug/oku`); mevzuat kaydı yoksa null. */
  legislationSlug: string | null;
}

export interface SoruOzeti {
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  options: { id: string; label: string; text: string }[];
  difficulty: SoruSurumu['difficulty'];
  relatedArticleRef: MaddeBagi | null;
}

/** Deneme türü modlarda madde bağı gizlenir. */
export function maddeBagiGosterilir(mode: string): boolean {
  return mode === 'practice' || mode === 'review' || mode === 'daily';
}

export function soruOzeti(v: SoruSurumu, mode: string): SoruOzeti {
  const no = v.question.articleNo;
  const ref: MaddeBagi | null =
    maddeBagiGosterilir(mode) && no
      ? {
          lawSlug: slugify(v.question.topic.name),
          no,
          slug: articleSlug(no),
          label: `${v.question.topic.legislation?.shortName ?? v.question.topic.name} md. ${no}`,
          legislationSlug: v.question.topic.legislation?.slug ?? null,
        }
      : null;
  return {
    questionId: v.questionId,
    versionId: v.id,
    stem: v.stem,
    mediaUrl: v.mediaUrl,
    options: v.options,
    difficulty: v.difficulty,
    relatedArticleRef: ref,
  };
}
