import { describe, expect, it } from "vitest";
import { bridgeSessionHref, parseBody, parseInline, unitDescription, unitProgressPct } from "./ozet";

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
