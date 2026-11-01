import { describe, expect, it } from "vitest";
import { homeActionHref } from "./home-actions";

const base = { label: "Başla", source: "home_next" } as const;

describe("homeActionHref (Bugün v3 eylem → web adresi)", () => {
  it("özet ünitesini /ozet/<slug>'a götürür; bozuk slug Kütüphane'ye düşer", () => {
    expect(
      homeActionHref({
        ...base,
        type: "open_summary",
        route: "/ozet/anayasa-yurutme",
      }),
    ).toBe("/ozet/anayasa-yurutme");
    expect(
      homeActionHref({ ...base, type: "open_summary", route: "/ozet/../x" }),
    ).toBe("/kutuphane");
  });
  it("deneme kimliği varsa kurallar sayfasına, yoksa listeye", () => {
    const id = "3f2a1c4e-9b7d-4e11-8a2b-0c1d2e3f4a5b";
    expect(
      homeActionHref({
        ...base,
        type: "open_exams",
        route: `/denemeler/${id}`,
      }),
    ).toBe(`/denemeler/${id}/baslamadan-once`);
    expect(
      homeActionHref({ ...base, type: "open_exams", route: "/denemeler" }),
    ).toBe("/denemeler");
  });
  it("yarım oturumu resume ile açar", () => {
    expect(
      homeActionHref({ ...base, type: "resume_session", sessionId: "s1" }),
    ).toBe("/seans?resume=s1&source=home_next");
  });
  it("yanlış odağı review, favoriler favorites, ünite reçetesi articleNos taşır", () => {
    const u = new URL(
      homeActionHref({
        ...base,
        type: "start_session",
        count: 20,
        focus: { kind: "wrongs" },
      }),
      "http://x",
    );
    expect(u.searchParams.get("mode")).toBe("review");
    expect(u.searchParams.get("count")).toBe("20");
    expect(u.searchParams.get("scope")).toBe("Yanlış tekrarı");
    const fav = new URL(
      homeActionHref({ ...base, type: "start_session", fromBookmarks: true }),
      "http://x",
    );
    expect(fav.searchParams.get("mode")).toBe("favorites");
    const unit = new URL(
      homeActionHref({
        ...base,
        type: "start_session",
        focus: { kind: "topic", topicId: "t1", label: "Yürütme" },
        articleNos: ["8", "104"],
      }),
      "http://x",
    );
    expect(unit.searchParams.get("topicId")).toBe("t1");
    expect(unit.searchParams.get("articleNos")).toBe("8,104");
    expect(unit.searchParams.get("scope")).toBe("Yürütme");
    expect(unit.searchParams.get("mode")).toBeNull();
  });
});
