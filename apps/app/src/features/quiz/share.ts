import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import type { AnswerFeedback, QuizDifficulty, QuizQuestion } from "./api";

/**
 * Soru paylaşımı (F10-P, Doc 49/15 §5; Figma "Paylaşım kartı · Soru / Cevaplı").
 * Kart ekran görüntüsü DEĞİLDİR: soru verisinden ayrı çizilir (`ShareQuestionCard`) ve
 * varsayılan olarak cevapsızdır. Kullanıcının işaretlediği şık hiçbir modda karta girmez;
 * kaynak etiketi de (CLAUDE.md) girmez. Cevaplı mod yalnız cevaplanmış soruda açılır ve
 * cevabı sunucudan yeniden istemez: turun geri bildiriminden (`AnswerFeedback`) alır.
 * Bağlantı `paemisyon.com/s/<id>`: uygulama yüklüyse universal link soruyu tek soruluk
 * turda açar, yoksa web iniş sayfası.
 */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;
/** Kart 360×450 mantıksal birimde çizilir, 3× yakalanır → 1080×1350 (4:5). */
export const SHARE_CARD_SCALE = 3;

export type ShareMode = "question" | "answer";

export interface ShareCardData {
  questionId: string;
  /** "Zor" — yoksa null (eski sunucu). */
  difficultyLabel: string | null;
  /** "PVSK · md. 4/A" — madde bağı; yoksa null. Kaynak etiketi DEĞİL. */
  articleLabel: string | null;
  stem: string;
  options: { label: string; text: string }[];
  /** Yalnız `answer` modunda dolu. */
  answer: { correctLabel: string | null; explanation: string | null; basis: string | null } | null;
  url: string;
}

const DIFFICULTY: Record<QuizDifficulty, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

export const questionShareUrl = (questionId: string) => `https://paemisyon.com/s/${questionId}`;

/** Açıklamanın ilk cümlesi; kart için yeter, tamamı uygulamada. */
export function firstSentence(text: string | null | undefined): string | null {
  const plain = (text ?? "").replace(/\s+/g, " ").trim();
  if (!plain) return null;
  const m = /^.*?[.!?](\s|$)/.exec(plain);
  const s = (m ? m[0] : plain).trim();
  return s.length > 220 ? `${s.slice(0, 217).trimEnd()}…` : s;
}

/** "PVSK md. 4/A" → "PVSK · md. 4/A" (hap biçimi). */
function hapEtiketi(label: string | null | undefined): string | null {
  if (!label) return null;
  return label.replace(/\s+md\.\s+/, " · md. ");
}

export function buildShareCardData(q: QuizQuestion, fb: AnswerFeedback | null, mode: ShareMode): ShareCardData {
  const correct = fb?.correctOptionId ? q.options.find((o) => o.id === fb.correctOptionId) : null;
  const articleLabel = hapEtiketi(q.relatedArticleRef?.label);
  return {
    questionId: q.questionId,
    difficultyLabel: q.difficulty ? DIFFICULTY[q.difficulty] : null,
    articleLabel,
    stem: q.stem,
    options: q.options.map((o) => ({ label: o.label, text: o.text })),
    answer:
      mode === "answer" && fb
        ? { correctLabel: correct?.label ?? null, explanation: firstSentence(fb.explanation), basis: fb.legalReference ?? q.relatedArticleRef?.label ?? null }
        : null,
    url: questionShareUrl(q.questionId),
  };
}

/** Görselin yanında giden metin: tek akıllı bağlantı; mağaza adı yok (kart uygulamada da görünür). */
export const shareMessage = (url: string) => `Bu soruyu sen de çöz: ${url}\nPaemisyon · polis amirliği sınavına hazırlık`;

/**
 * Bağlı görünümü PNG'ye yakalar ve görsel + metni birlikte sistem paylaşım sayfasına verir.
 * Kullanıcı vazgeçerse `false`; başka hata fırlatılır.
 */
export async function shareCardImage(view: Parameters<typeof captureRef>[0], data: ShareCardData): Promise<boolean> {
  const uri = await captureRef(view, { format: "png", quality: 1, result: "tmpfile", width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT });
  try {
    await Share.open({ url: uri.startsWith("file://") ? uri : `file://${uri}`, type: "image/png", message: shareMessage(data.url), failOnCancel: true });
    return true;
  } catch (error) {
    if ((error as { message?: string })?.message === "User did not share") return false;
    throw error;
  }
}
