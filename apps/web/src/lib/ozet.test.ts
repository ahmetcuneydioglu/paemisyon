import { describe, expect, it } from "vitest";
import { bridgeSessionHref, masteryLabel, parseBody, parseInline, unitDescription, unitProgressPct, weakestUnit } from "./ozet";

describe("özet gövdesi (markdown-lite)", () => {
  it("kalın parçalar ayrışır", () => {
    expect(parseInline("TBMM **600 milletvekilinden** oluşur.")).toEqual([
      { bold: false, text: "TBMM " },
      { bold: true, text: "600 milletvekilinden" },
      { bold: false, text: " oluşur." },
    ]);
  });

  it("başlık satırını izleyen liste ayrı liste olur", () => {
    const paras = parseBody("**Seçilemeyenler:**\n- Kısıtlılar\n- Yasaklılar\n\nSon paragraf.");
    expect(paras.map((p) => p.kind)).toEqual(["p", "list", "p"]);
    expect(paras[1]).toMatchObject({ ordered: false });
    expect((paras[1] as { items: unknown[] }).items).toHaveLength(2);
  });

  it("numaralı liste sıralı sayılır, liste işareti metinden çıkar", () => {
    const [list] = parseBody("1. Bir defa\n2. **30 ay** geçmeli");
    expect(list).toMatchObject({ kind: "list", ordered: true });
    expect((list as { items: { text: string }[][] }).items[1][0].text).toBe("30 ay");
  });
});

describe("köprü ve meta", () => {
  it("seans adresi ünite maddelerini virgülle taşır", () => {
    const href = bridgeSessionHref({ topicId: "t1", articleNos: ["75", "76"], scope: "Yasama I" });
    expect(href).toContain("topicId=t1");
    expect(href).toContain("articleNos=75%2C76");
    expect(href).toContain("count=10");
  });

  it("açıklama ilk gövdeden, işaretsiz, 160 karakter altı", () => {
    const d = unitDescription({
      subtitle: null,
      legislation: { slug: "x", name: "T.C. Anayasası", shortName: null },
      blocks: [{ id: "1", type: "concept", title: null, body: "**600** milletvekili. " + "a".repeat(300), rows: null, articles: [] }],
    });
    expect(d.startsWith("600 milletvekili.")).toBe(true);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d).not.toContain("**");
  });

  it("ilerleme yüzdesi: yok 0, bitmiş 100, arada kart oranı", () => {
    expect(unitProgressPct({ blockCount: 22, progress: null })).toBe(0);
    expect(unitProgressPct({ blockCount: 22, progress: { lastBlockIndex: 21, completedAt: "x" } })).toBe(100);
    expect(unitProgressPct({ blockCount: 22, progress: { lastBlockIndex: 10, completedAt: null } })).toBe(50);
  });
});

describe("ünite hâkimiyeti (Doc 53 F5)", () => {
  it("en zayıf ünite: band weak içinde en düşük yüzde", () => {
    const u = weakestUnit([
      { slug: "a", mastery: { solved: 12, band: "weak", accuracyPct: 50 } },
      { slug: "b", mastery: { solved: 15, band: "weak", accuracyPct: 40 } },
      { slug: "c", mastery: { solved: 20, band: "strong", accuracyPct: 90 } },
      { slug: "d", mastery: null },
    ]);
    expect(u?.slug).toBe("b");
    expect(weakestUnit([{ slug: "x", mastery: { solved: 0, band: "new", accuracyPct: null } }])).toBeNull();
  });
  it("etiket: yeni, az veri, yüzde + band", () => {
    expect(masteryLabel({ solved: 0, band: "new", accuracyPct: null })).toBe("yeni");
    expect(masteryLabel({ solved: 5, band: "sparse", accuracyPct: 60 })).toBe("az veri (5 soru)");
    expect(masteryLabel({ solved: 12, band: "weak", accuracyPct: 33 })).toBe("%33 · zayıf");
    expect(masteryLabel({ solved: 12, band: "normal", accuracyPct: 65 })).toBe("%65");
    expect(masteryLabel(null)).toBeNull();
  });
});
