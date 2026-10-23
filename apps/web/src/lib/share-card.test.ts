import { describe, expect, it } from "vitest";
import {
  buildShareCardData,
  firstSentence,
  hapEtiketi,
  questionShareUrl,
  shareMessage,
} from "./share-card";

const soru = {
  questionId: "q1",
  stem: "PVSK'ye göre durdurma için hangisi gereklidir?",
  options: [
    { id: "a", label: "A", text: "Savcıdan yazılı izin" },
    { id: "c", label: "C", text: "Makul bir sebep" },
  ],
  difficulty: "hard" as const,
  relatedArticleRef: { label: "PVSK md. 4/A" },
};
const fb = {
  correctOptionId: "c",
  explanation: "Durdurma için makul bir sebep gerekir. Kesin delil aranmaz.",
  legalReference: "2559 sayılı PVSK md. 4/A",
};

describe("paylaşım kartı verisi", () => {
  it("soru modunda cevap ve kaynak etiketi yok; madde bağı hap biçiminde", () => {
    const d = buildShareCardData(soru, fb, "question");
    expect(d.answer).toBeNull();
    expect(d.articleLabel).toBe("PVSK · md. 4/A");
    expect(d.difficultyLabel).toBe("Zor");
    expect(d.url).toBe(questionShareUrl("q1"));
    expect(JSON.stringify(d)).not.toMatch(/sourceLabel|isCorrect/);
  });
  it("cevaplı modda doğru harf, ilk cümle ve dayanak", () => {
    const d = buildShareCardData(soru, fb, "answer");
    expect(d.answer).toEqual({
      correctLabel: "C",
      explanation: "Durdurma için makul bir sebep gerekir.",
      basis: "2559 sayılı PVSK md. 4/A",
    });
  });
  it("cevaplı mod geri bildirim yoksa soru moduna düşer", () => {
    expect(buildShareCardData(soru, null, "answer").answer).toBeNull();
  });
  it("yardımcılar", () => {
    expect(firstSentence("  Çok   boşluk. İkinci.")).toBe("Çok boşluk.");
    expect(firstSentence("")).toBeNull();
    expect(firstSentence("a".repeat(300))!.endsWith("…")).toBe(true);
    expect(hapEtiketi("TCK md. 43")).toBe("TCK · md. 43");
    expect(hapEtiketi(null)).toBeNull();
    expect(shareMessage("https://paemisyon.com/s/q1")).toContain("/s/q1");
  });
});
