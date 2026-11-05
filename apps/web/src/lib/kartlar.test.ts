import { describe, expect, it } from "vitest";
import { countsNote, hasFlashcards, isFlashcardMode, isFlashcardSource, isLockedScope, kartDonusHref, kartKisayolu, kartlarHref, modeCount, relativeDay, requeueAgain, roomCountsToModeCounts, sessionLine, tallyLine } from "./kartlar";

const counts = { total: 24, new: 9, learning: 13, learned: 2, due: 6, hard: 3, favorites: 1, locked: 0 };

describe("bilgi kartları yardımcıları (Doc 56)", () => {
  it("mod sayımı: due/new/hard/favorites kendi sayısı, all ve mixed toplam", () => {
    expect(modeCount(counts, "due")).toBe(6);
    expect(modeCount(counts, "favorites")).toBe(1);
    expect(modeCount(counts, "all")).toBe(24);
    expect(modeCount(counts, "mixed")).toBe(24);
  });

  it("oda sayımı → mod sayımı; satır çizme ve kilit kararı", () => {
    expect(roomCountsToModeCounts({ count: 10, due: 2, learned: 4, locked: 0 })).toMatchObject({ total: 10, learned: 4, learning: 6, due: 2 });
    expect(hasFlashcards(null)).toBe(false);
    expect(hasFlashcards({ count: 0, due: 0, learned: 0, locked: 0 })).toBe(false);
    expect(hasFlashcards({ count: 0, due: 0, learned: 0, locked: 5 })).toBe(true);
    expect(isLockedScope({ count: 0, due: 0, learned: 0, locked: 5 })).toBe(true);
    expect(isLockedScope({ count: 3, due: 0, learned: 0, locked: 5 })).toBe(false);
  });

  it("künye: öğrenildi ve tekrar; tekrar yoksa yeni", () => {
    expect(countsNote(counts)).toBe("24 kart · 2 öğrenildi · 6 tekrar bekliyor");
    expect(countsNote({ ...counts, due: 0 })).toBe("24 kart · 2 öğrenildi · 9 yeni");
    expect(countsNote({ total: 5, learned: 0, due: 0, new: 5 })).toBe("5 kart");
  });

  it("oynatıcı adresi: ünite > konu > ders önceliği, kaynak ve etiket", () => {
    expect(kartlarHref({ topicId: "t1", courseId: "c1" }, "due", "topic_room", "Yasama I")).toBe("/kartlar?topicId=t1&mode=due&source=topic_room&scope=Yasama+I");
    expect(kartlarHref({ unitSlug: "u", topicId: "t1" }, "new")).toBe("/kartlar?unitSlug=u&mode=new");
    expect(kartlarHref({ courseId: "c1" }, "all")).toBe("/kartlar?courseId=c1&mode=all");
    expect(kartlarHref({}, "due", "study_hub", "Kart tekrarı")).toBe("/kartlar?mode=due&source=study_hub&scope=Kart+tekrar%C4%B1");
    expect(kartlarHref({ topicId: "t1" }, "due", undefined, undefined, { resume: true, nonce: 7 })).toBe("/kartlar?topicId=t1&mode=due&resume=1&n=7");
  });

  it("dönüş adresi: Bugün kaynakları Bugün'e, kapsam odasına, kapsamsız Kütüphane'ye", () => {
    expect(kartDonusHref({ topicId: "t1" }, "home_route")).toBe("/bugun");
    expect(kartDonusHref({ topicId: "t1" }, "notif")).toBe("/bugun");
    expect(kartDonusHref({ unitSlug: "u", topicId: "t1" }, "summary")).toBe("/ozet/u");
    expect(kartDonusHref({ topicId: "t1" }, "topic_room")).toBe("/kutuphane/konu/t1");
    expect(kartDonusHref({ courseId: "c1" }, "course_room")).toBe("/kutuphane/ders/c1");
    expect(kartDonusHref({}, "study_hub")).toBe("/kutuphane");
    expect(isFlashcardMode("mixed")).toBe(true);
    expect(isFlashcardMode("x")).toBe(false);
    expect(isFlashcardSource("home_next")).toBe(true);
    expect(isFlashcardSource(undefined)).toBe(false);
  });

  it("oturum içi tekrar: en çok iki görünüm", () => {
    const a = { id: "a" };
    expect(requeueAgain([a, { id: "b" }], a).map((c) => c.id)).toEqual(["a", "b", "a"]);
    expect(requeueAgain([a, { id: "b" }, a], a).map((c) => c.id)).toEqual(["a", "b", "a"]);
  });

  it("oturum sonu cümlesi ve göreli gün", () => {
    const now = new Date("2026-11-05T10:00:00Z");
    expect(relativeDay("2026-11-06T09:00:00Z", now)).toBe("yarın");
    expect(relativeDay("2026-11-08T09:00:00Z", now)).toBe("3 gün sonra");
    const s = { sessionId: "s", summary: { reviewed: 20, known: 16, again: 4, uniqueCards: 18, knownPct: 80 }, due: { count: 0, nextAt: "2026-11-06T09:00:00Z" }, dailyGoal: { target: 40, done: 36 } };
    expect(sessionLine(s, now)).toBe("Kartların %80'ini hatırladın. Sıradaki tekrar yarın.");
    expect(sessionLine({ ...s, due: { count: 7, nextAt: null } }, now)).toBe("Kartların %80'ini hatırladın. 7 kart tekrar bekliyor.");
  });

  it("klavye kısayolları", () => {
    expect(kartKisayolu("ArrowLeft")).toBe("again");
    expect(kartKisayolu("ArrowRight")).toBe("known");
    expect(kartKisayolu(" ")).toBe("flip");
    expect(kartKisayolu("F")).toBe("bookmark");
    expect(kartKisayolu("z")).toBe("undo");
    expect(kartKisayolu("Escape")).toBe("exit");
    expect(kartKisayolu("q")).toBeNull();
    expect(tallyLine(0, 0)).toMatch(/Tekrar/);
    expect(tallyLine(3, 1)).toBe("Bu tur · 3 biliyorum · 1 tekrar");
  });
});
