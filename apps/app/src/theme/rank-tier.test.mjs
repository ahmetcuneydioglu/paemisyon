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
  assert.equal(leagueColor(4, "light"), "#B7791F");
  assert.equal(leagueColor(5, "dark"), "#34D399");
  assert.equal(leagueColor(5, "light"), "#047857");
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
  { level: 6, name: "Vardiya Amiri", minScore: 3500 },
  { level: 7, name: "Birim Amiri", minScore: 7000 },
  { level: 8, name: "Komiserlik Kapısı", minScore: 12000 },
];

test("xpProgress sunucu kataloğuyla: Grup Amiri 2793 XP → Vardiya Amiri'ne 707 XP, %58", () => {
  assert.deepEqual(xpProgress(2793, 5, KATALOG), { pct: 58, toNext: 707, nextMin: 3500, nextName: "Vardiya Amiri" });
});

test("xpProgress katalog sırası karışık gelse de seviyeye göre bulur", () => {
  const karisik = [...KATALOG].reverse();
  assert.equal(xpProgress(2793, 5, karisik).nextName, "Vardiya Amiri");
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
