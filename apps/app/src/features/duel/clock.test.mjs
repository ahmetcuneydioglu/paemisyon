// Saf saat yardımcıları — `node --test src/features/duel/clock.test.mjs` (TS'yi tip sıyırma ile yükler).
import { test } from "node:test";
import assert from "node:assert/strict";
import { clockView, mergeOffset, mmss, points, seconds1, signed } from "./clock.ts";

const T0 = Date.parse("2026-11-27T10:00:00.000Z");
const q = { phase: "question", phaseStartedAt: new Date(T0).toISOString(), phaseEndsAt: new Date(T0 + 20_000).toISOString(), offsetMs: 0 };

test("sayaç sunucu saatine göre akar (cihaz saati 3 sn geri olsa da)", () => {
  const v = clockView({ ...q, offsetMs: 3_000 }, T0 + 5_000);
  assert.equal(v.remainingMs, 12_000);
  assert.equal(v.seconds, 12);
  assert.equal(v.urgent, false);
});

test("son 5 saniye dikkat durumudur; süre bitince değil", () => {
  assert.equal(clockView(q, T0 + 14_900).urgent, false);
  assert.equal(clockView(q, T0 + 15_000).urgent, true);
  assert.equal(clockView(q, T0 + 19_950).seconds, 1);
  const bitti = clockView(q, T0 + 20_000);
  assert.deepEqual([bitti.seconds, bitti.urgent, bitti.expired, bitti.fraction], [0, false, true, 0]);
});

test("gösterim fazında dikkat durumu yok", () => {
  assert.equal(clockView({ ...q, phase: "reveal" }, T0 + 18_000).urgent, false);
});

test("damgasız faz (lobi) sıfır döner", () => {
  assert.equal(clockView({ phase: "lobby", phaseStartedAt: null, phaseEndsAt: null, offsetMs: 0 }, T0).seconds, 0);
});

test("saat farkı: en az gecikmeli (en büyük) ölçüm tutulur", () => {
  const a = mergeOffset(null, new Date(T0 + 1_000).toISOString(), T0 + 400); // 600
  const b = mergeOffset(a, new Date(T0 + 2_000).toISOString(), T0 + 1_100); // 900
  const c = mergeOffset(b, new Date(T0 + 3_000).toISOString(), T0 + 2_500); // 500 → 900 kalır
  assert.deepEqual([a, b, c], [600, 900, 900]);
});

test("biçimler", () => {
  assert.equal(mmss(72_400), "1:12");
  assert.equal(seconds1(7_449), "7,4 sn");
  assert.equal(seconds1(null), "–");
  assert.equal(points(1036), "1.036");
  assert.deepEqual([signed(12), signed(-11), signed(0)], ["+12", "−11", "0"]);
});
