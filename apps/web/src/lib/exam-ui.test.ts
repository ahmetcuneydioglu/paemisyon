import { describe, expect, it } from "vitest";
import type { ExamListItem } from "./types";
import { examCardModel, fmtDuration, fmtNet, heroFor, rankSentence } from "./exam-ui";

function exam(over: Partial<ExamListItem> = {}): ExamListItem {
  return {
    id: "e1",
    title: "Genel Deneme 7",
    description: null,
    startAt: "2026-10-20T00:00:00Z",
    endAt: "2026-10-20T02:30:00Z",
    durationMinutes: 150,
    questionCount: 100,
    isPremium: false,
    questionsOpenAfterEnd: true,
    archiveOpenAfterEnd: true,
    state: "active",
    participantCount: 1203,
    avgScore: 48.2,
    myAttempt: null,
    myArchiveAttempt: null,
    publishMode: "serbest",
    difficulty: "orta",
    examTypeId: null,
    liveAnswerReveal: false,
    practiceAfterEnd: true,
    availability: "open",
    myState: "new",
    canStartOfficial: true,
    canStartPractice: false,
    my: { official: null, active: null, practiceCount: 0, lastPractice: null },
    ...over,
  };
}

describe("fmt", () => {
  it("net virgüllü, sıfırlar kırpılmış", () => {
    expect(fmtNet(61.75)).toBe("61,75");
    expect(fmtNet(72)).toBe("72");
    expect(fmtNet(58.5)).toBe("58,5");
    expect(fmtNet(null)).toBe("—");
  });
  it("süre", () => {
    expect(fmtDuration(6480)).toBe("1 sa 48 dk");
    expect(fmtDuration(720)).toBe("12 dk");
    expect(fmtDuration(45)).toBe("45 sn");
  });
  it("sıra cümlesi", () => {
    expect(rankSentence(245, 1203)).toBe("1.203 kişide 245.");
    expect(rankSentence(null, 10)).toBeNull();
  });
});

describe("examCardModel", () => {
  it("yeni serbest deneme → Başla, kurallar sayfasına", () => {
    const m = examCardModel(exam(), true);
    expect(m.kind).toBe("new");
    expect(m.primary?.href).toBe("/denemeler/e1/baslamadan-once");
  });
  it("devam eden çözüm → Devam et, pratikse role parametresi", () => {
    const m = examCardModel(
      exam({ myState: "in_progress", my: { official: null, active: { attemptId: "a", role: "practice", deadlineAt: null, answered: 34 }, practiceCount: 0, lastPractice: null } }),
      true,
    );
    expect(m.kind).toBe("in_progress");
    expect(m.primary?.href).toBe("/sinav/e1?role=practice");
    expect(m.status).toBe("34/100 cevaplandı");
  });
  it("tamamlanmış resmî çözüm → sonuç + tekrar çöz, net ve sıra", () => {
    const m = examCardModel(
      exam({
        myState: "completed",
        canStartOfficial: false,
        canStartPractice: true,
        my: { official: { attemptId: "a1", status: "completed", resultLocked: false, score: 61.75, correct: 72, wrong: 18, blank: 10, rank: 245, total: 1203, completedAt: null }, active: null, practiceCount: 0, lastPractice: null },
      }),
      true,
    );
    expect(m.kind).toBe("done");
    expect(m.primary?.href).toBe("/sonuc/a1");
    expect(m.secondary?.href).toBe("/denemeler/e1/baslamadan-once?role=practice");
    expect(m.status).toBe("61,75 net · 1.203 kişide 245.");
  });
  it("takvimli sonuç kilitli → Teslimi gör, net yok", () => {
    const m = examCardModel(
      exam({
        publishMode: "takvimli",
        myState: "completed",
        canStartOfficial: false,
        canStartPractice: false,
        my: { official: { attemptId: "a1", status: "completed", resultLocked: true, score: null, correct: null, wrong: null, blank: null, rank: null, total: 10, completedAt: null }, active: null, practiceCount: 0, lastPractice: null },
      }),
      true,
    );
    expect(m.primary?.label).toBe("Teslimi gör");
    expect(m.status).toBe("Sonuç bekliyor");
  });
  it("premium kilit", () => {
    const m = examCardModel(exam({ isPremium: true, canStartOfficial: false }), true);
    expect(m.kind).toBe("locked");
    expect(m.primary?.href).toBe("/premium");
  });
  it("kapanmış haftalık → pratik + sıralama", () => {
    const m = examCardModel(exam({ publishMode: "takvimli", availability: "closed", canStartOfficial: false, canStartPractice: true }), true);
    expect(m.kind).toBe("weekly_missed");
    expect(m.primary?.label).toBe("Pratik olarak çöz");
    expect(m.secondary?.href).toBe("/siralama/e1");
  });
  it("girişsiz → giriş", () => {
    expect(examCardModel(exam(), false).primary?.href).toContain("/giris?next=");
  });
});

describe("heroFor", () => {
  it("devam eden > sıradaki haftalık > sakin", () => {
    const weekly = exam({ id: "w", publishMode: "takvimli", availability: "upcoming" });
    expect(heroFor([exam(), weekly]).kind).toBe("weekly");
    const active = exam({ id: "x", myState: "in_progress", my: { official: null, active: { attemptId: "a", role: "official", deadlineAt: null, answered: 1 }, practiceCount: 0, lastPractice: null } });
    expect(heroFor([weekly, active]).kind).toBe("active");
    expect(heroFor([exam()]).kind).toBe("calm");
  });
});
