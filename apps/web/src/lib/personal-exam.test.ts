import { describe, expect, it } from "vitest";
import { personalExamState } from "./personal-exam";
import type { MeDashboard } from "./public-api";

function pano(p: Partial<MeDashboard["personalExam"]>): MeDashboard {
  return {
    isPremium: p.dailyAllowance == null,
    today: { answered: 0, dailyLimit: null },
    daily: { playedToday: false },
    personalExam: {
      usedToday: p.usedToday ?? 0,
      dailyAllowance: p.dailyAllowance === undefined ? 1 : p.dailyAllowance,
      maxQuestions: p.maxQuestions ?? 25,
    },
  };
}

describe("personalExamState", () => {
  it("ücretsiz planda 50 ve 100 kilitli, 25 birincil eylemdir", () => {
    const s = personalExamState(pano({ maxQuestions: 25 }));
    expect(s.sinirsiz).toBe(false);
    expect(s.kalan).toBe(1);
    expect(s.secenekler).toEqual([
      { sayi: 25, kilitli: false, birincil: true },
      { sayi: 50, kilitli: true, birincil: false },
      { sayi: 100, kilitli: true, birincil: false },
    ]);
  });

  it("hak tükendiğinde kart Premium'a yönlenir", () => {
    const s = personalExamState(pano({ dailyAllowance: 1, usedToday: 1 }));
    expect(s.hakkiBitti).toBe(true);
    expect(s.kalan).toBe(0);
  });

  it("hak eksiye düşmez (sunucu sayacı ileri giderse)", () => {
    const s = personalExamState(pano({ dailyAllowance: 1, usedToday: 5 }));
    expect(s.kalan).toBe(0);
  });

  it("premium sınırsızdır ve hiçbir uzunluk kilitlenmez", () => {
    const s = personalExamState(pano({ dailyAllowance: null, maxQuestions: 120 }));
    expect(s.sinirsiz).toBe(true);
    expect(s.hakkiBitti).toBe(false);
    expect(s.secenekler.some((o) => o.kilitli)).toBe(false);
    expect(s.secenekler.find((o) => o.birincil)?.sayi).toBe(100);
  });

  it("bilgi yoksa kart KISITSIZ çizilir — hakkı olan kullanıcı kilitlenmez", () => {
    const s = personalExamState(null);
    expect(s.sinirsiz).toBe(true);
    expect(s.hakkiBitti).toBe(false);
    expect(s.secenekler.some((o) => o.kilitli)).toBe(false);
  });

  it("panelden limit yükseltilirse kalan hak doğru sayılır", () => {
    const s = personalExamState(pano({ dailyAllowance: 3, usedToday: 1 }));
    expect(s.kalan).toBe(2);
    expect(s.hakkiBitti).toBe(false);
  });
});
