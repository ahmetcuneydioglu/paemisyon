import assert from "node:assert/strict";
import { test } from "node:test";
import { FALLBACK_MIN_SCORES, RANK_TIERS, leagueColor, rankTier, withAlpha, xpProgress } from "./rank-tier.ts";

test("8 lig; seviyeler ardışık; adlar web rank-tier.ts ile aynı", () => {
  assert.equal(RANK_TIERS.length, 8);
  RANK_TIERS.forEach((t, i) => assert.equal(t.level, i + 1));
  assert.deepEqual(
    RANK_TIERS.map((t) => t.league),
    ["Demir", "Bronz", "Gümüş", "Altın", "Zümrüt", "Safir", "Ametist", "Elmas"],
  );
});

test("rankTier aralık dışı ve bozuk seviyeyi kırpar", () => {
  assert.equal(rankTier(0).league, "Demir");
  assert.equal(rankTier(-3).level, 1);
  assert.equal(rankTier(99).league, "Elmas");
  assert.equal(rankTier(Number.NaN).level, 1);
  assert.equal(rankTier(5.7).league, "Zümrüt");
});

test("leagueColor: koyuda açık ton, açıkta koyu ton", () => {
  assert.equal(leagueColor(4, "dark"), "#F4C430");
  assert.equal(leagueColor(4, "light"), "#866300");
  assert.equal(leagueColor(5, "dark"), "#34D399");
  assert.equal(leagueColor(5, "light"), "#04704F");
});

test("yedek eşikler api/coach/rank.logic RANKS ile birebir", () => {
  assert.deepEqual([...FALLBACK_MIN_SCORES], [0, 150, 400, 900, 1800, 3500, 7000, 12000]);
});

const KATALOG = [
  { level: 1, name: "Aday", minScore: 0 },
  { level: 2, name: "Devriye", minScore: 150 },
  { level: 3, name: "Kıdemli Devriye", minScore: 400 },
  { level: 4, name: "Ekip Amiri", minScore: 900 },
  { level: 5, name: "Grup Amiri", minScore: 1800 },
  { level: 6, name: "Ekipler Amiri", minScore: 3500 },
  { level: 7, name: "Birim Amiri", minScore: 7000 },
  { level: 8, name: "Komiserlik Kapısı", minScore: 12000 },
];

test("xpProgress sunucu kataloğuyla: Grup Amiri 2793 XP → Ekipler Amiri'ne 707 XP, %58", () => {
  assert.deepEqual(xpProgress(2793, 5, KATALOG), { pct: 58, toNext: 707, nextMin: 3500, nextName: "Ekipler Amiri" });
});

test("xpProgress katalog sırası karışık gelse de seviyeye göre bulur", () => {
  const karisik = [...KATALOG].reverse();
  assert.equal(xpProgress(2793, 5, karisik).nextName, "Ekipler Amiri");
});

test("xpProgress katalogsuz (eski sunucu): yedek eşikler, ad yok", () => {
  assert.deepEqual(xpProgress(3001, 5), { pct: 71, toNext: 499, nextMin: 3500, nextName: null });
  assert.deepEqual(xpProgress(3001, 5, []), { pct: 71, toNext: 499, nextMin: 3500, nextName: null });
});

test("xpProgress: son rütbe %100, kalan 0; eşik altı veri %0'a kırpılır", () => {
  assert.deepEqual(xpProgress(15000, 8, KATALOG), { pct: 100, toNext: 0, nextMin: null, nextName: null });
  assert.deepEqual(xpProgress(100, 3, KATALOG), { pct: 0, toNext: 800, nextMin: 900, nextName: "Ekip Amiri" });
  assert.equal(xpProgress(150, 2).pct, 0);
  assert.equal(xpProgress(399, 2).pct, 100);
});

test("withAlpha hex'i rgba'ya çevirir; bozuk girdiyi olduğu gibi bırakır", () => {
  assert.equal(withAlpha("#E8B46C", 0.4), "rgba(232,180,108,0.4)");
  assert.equal(withAlpha("#E8B46C", 2), "rgba(232,180,108,1)");
  assert.equal(withAlpha("rgb(1,2,3)", 0.5), "rgb(1,2,3)");
});

// Açık şema lig tonları 12 pt metin rengidir: beyaz kartta ve "sen" satırının accentSoft
// zemininde (#F6E9D2) WCAG AA 4,5:1'i geçmeli (10 Kas 2026 ölçümü).
test("açık şema lig metni AA kontrastı", () => {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  for (let level = 1; level <= 8; level++) {
    const c = leagueColor(level, "light");
    for (const zemin of ["#FFFFFF", "#F6E9D2"]) {
      assert.ok(ratio(c, zemin) >= 4.5, `seviye ${level} ${c} / ${zemin}: ${ratio(c, zemin).toFixed(2)}`);
    }
  }
});
