import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAMPION_HALO, RANK_MIN_SCORES, RANK_TIERS, rankTier, withAlpha, xpProgress } from "./rank-tier.ts";

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

test("eşikler api/coach/rank.logic RANKS ile birebir", () => {
  assert.deepEqual([...RANK_MIN_SCORES], [0, 150, 400, 900, 1800, 3500, 7000, 12000]);
});

test("xpProgress: Grup Amiri 3001 XP → bir üst rütbeye 499 XP, %71 (web ekran görüntüsü)", () => {
  assert.deepEqual(xpProgress(3001, 5), { pct: 71, toNext: 499, nextMin: 3500 });
});

test("xpProgress: son rütbe %100, kalan 0; eşik altı veri %0'a kırpılır", () => {
  assert.deepEqual(xpProgress(15000, 8), { pct: 100, toNext: 0, nextMin: null });
  assert.deepEqual(xpProgress(100, 3), { pct: 0, toNext: 800, nextMin: 900 });
  assert.equal(xpProgress(150, 2).pct, 0);
  assert.equal(xpProgress(399, 2).pct, 100);
});

test("withAlpha hex'i rgba'ya çevirir; bozuk girdiyi olduğu gibi bırakır", () => {
  assert.equal(withAlpha(CHAMPION_HALO, 0.45), "rgba(255,208,92,0.45)");
  assert.equal(withAlpha("#E8B46C", 2), "rgba(232,180,108,1)");
  assert.equal(withAlpha("rgb(1,2,3)", 0.5), "rgb(1,2,3)");
});
