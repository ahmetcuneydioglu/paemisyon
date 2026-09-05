import { describe, expect, it } from "vitest";
import { bannerExam, baslangicEtiketi } from "./exam-banner";
import type { ExamListItem } from "./types";

const SIMDI = new Date("2026-09-06T12:00:00Z").getTime();

function deneme(p: Partial<ExamListItem>): ExamListItem {
  return {
    id: p.id ?? "e1",
    title: p.title ?? "Deneme",
    description: null,
    startAt: p.startAt ?? "2026-09-06T18:00:00Z",
    endAt: p.endAt ?? "2026-09-06T19:30:00Z",
    durationMinutes: 90,
    questionCount: 100,
    isPremium: false,
    questionsOpenAfterEnd: true,
    state: p.state ?? "upcoming",
    participantCount: 0,
    avgScore: null,
    myAttempt: null,
  };
}

describe("bannerExam", () => {
  it("canlı deneme her zaman şerit olur", () => {
    const canli = deneme({ id: "canli", state: "active" });
    expect(bannerExam([canli], SIMDI)?.id).toBe("canli");
  });

  it("canlı varsa yaklaşan denemenin önüne geçer", () => {
    const list = [
      deneme({ id: "yaklasan", state: "upcoming", startAt: "2026-09-06T18:00:00Z" }),
      deneme({ id: "canli", state: "active" }),
    ];
    expect(bannerExam(list, SIMDI)?.id).toBe("canli");
  });

  it("24 saat içinde başlayan deneme şerit olur", () => {
    const yakin = deneme({ id: "yakin", startAt: "2026-09-07T09:00:00Z" }); // 21 saat
    expect(bannerExam([yakin], SIMDI)?.id).toBe("yakin");
  });

  it("24 saatten uzaktaki deneme şerit OLMAZ", () => {
    // Şerit sayfanın en üstünü işgal ediyor; haftaya olan bir deneme için
    // sürekli açık kalırsa gürültüye döner ve gerçekten acil olduğunda
    // görünmez olur. Uzak deneme sağ kolondaki kartta kalır.
    const uzak = deneme({ id: "uzak", startAt: "2026-09-09T18:00:00Z" });
    expect(bannerExam([uzak], SIMDI)).toBeNull();
  });

  it("sınırdaki deneme (tam 24 saat) şerit olur", () => {
    const sinir = deneme({ id: "sinir", startAt: "2026-09-07T12:00:00Z" });
    expect(bannerExam([sinir], SIMDI)?.id).toBe("sinir");
  });

  it("birden fazla yaklaşan varsa en yakını seçilir", () => {
    const list = [
      deneme({ id: "gec", startAt: "2026-09-07T10:00:00Z" }),
      deneme({ id: "erken", startAt: "2026-09-06T20:00:00Z" }),
    ];
    expect(bannerExam(list, SIMDI)?.id).toBe("erken");
  });

  it("bitmiş denemeler şerit olmaz", () => {
    expect(bannerExam([deneme({ state: "ended" })], SIMDI)).toBeNull();
  });

  it("deneme yoksa null döner", () => {
    expect(bannerExam([], SIMDI)).toBeNull();
  });
});

describe("baslangicEtiketi", () => {
  // 24 saatlik eşik tek başına "Bugün" demeye yetmez: gece yarısını geçen bir
  // deneme 20 saat uzakta olsa bile YARIN'dır. Karşılaştırma TR gününe göre.
  const geceYarisiOncesi = new Date("2026-09-06T20:00:00Z").getTime(); // TR 23:00

  it("aynı TR gününde başlayan denemeye Bugün der", () => {
    expect(baslangicEtiketi("2026-09-06T20:30:00Z", geceYarisiOncesi)).toBe("Bugün");
  });

  it("gece yarısını geçince, 2 saat sonrası bile Yarın'dır", () => {
    expect(baslangicEtiketi("2026-09-06T22:00:00Z", geceYarisiOncesi)).toBe("Yarın");
  });

  it("iki gün sonrası için etiket vermez", () => {
    expect(baslangicEtiketi("2026-09-08T18:00:00Z", geceYarisiOncesi)).toBeNull();
  });
});
