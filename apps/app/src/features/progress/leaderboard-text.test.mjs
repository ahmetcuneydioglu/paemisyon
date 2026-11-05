import assert from "node:assert/strict";
import { test } from "node:test";
import { fmtInt, formatLastActive, initials, motivationLine } from "./leaderboard-text.ts";

test("fmtInt Türkçe binlik ayırıcı", () => {
  assert.equal(fmtInt(0), "0");
  assert.equal(fmtInt(549), "549");
  assert.equal(fmtInt(1316), "1.316");
  assert.equal(fmtInt(1234567), "1.234.567");
});

test("formatLastActive göreli metin", () => {
  const now = new Date(2026, 10, 5, 15, 30); // 5 Kas 2026
  assert.equal(formatLastActive(null, now), "—");
  assert.equal(formatLastActive("bozuk", now), "—");
  assert.equal(formatLastActive("2026-11-05", now), "bugün");
  assert.equal(formatLastActive("2026-11-09", now), "bugün"); // gelecek tarih savunması
  assert.equal(formatLastActive("2026-11-04", now), "dün");
  assert.equal(formatLastActive("2026-11-02", now), "3 gün önce");
  assert.equal(formatLastActive("2026-10-20T00:00:00.000Z".slice(0, 10), now), "2 hafta önce");
  assert.equal(formatLastActive("2026-08-01", now), "3 ay önce");
});

test("motivationLine dalları (web ile aynı sıra, isme ek yok)", () => {
  assert.equal(motivationLine(1, null, null), "Zirvedesin — tacı koru! 👑");
  assert.equal(motivationLine(84, 3, "ahmet"), "Önünde ahmet var — fark sadece 3 puan.");
  assert.equal(motivationLine(84, 1500, "Ayşe"), "Önünde Ayşe var — fark sadece 1.500 puan.");
  assert.equal(motivationLine(5, 0, "Ali"), "Ali ile berabersin — 1 doğruyla öne geç!");
  assert.equal(motivationLine(7, null, null), "İlk 10'dasın — bir adım daha yukarı!");
  assert.equal(motivationLine(84, null, null), "Her doğru seni yukarı taşır. Devam et!");
  assert.equal(motivationLine(0, null, null), "Bir tur çöz, tabloda yerini al.");
});

test("initials Türkçe büyük harf", () => {
  assert.equal(initials("ilker yıldız"), "İY");
  assert.equal(initials("latte"), "L");
  assert.equal(initials("  Mustafa  ÖZDALAR "), "MÖ");
  assert.equal(initials(""), "?");
});
