import { describe, expect, it } from "vitest";
import { formatDate, formatTime, formatTimeRange } from "./format";

/**
 * Saat dilimi kritik: sunucu UTC, kullanıcı TR (UTC+3). Denemenin gösterilen
 * saati Europe/Istanbul olmalı — eski listedeki d.m.Y ve H:i–H:i biçimi.
 */
describe("format helpers (Europe/Istanbul)", () => {
  const iso = "2026-07-14T17:00:00.000Z"; // UTC 17:00 → TR 20:00

  it("formatDate → gün.ay.yıl", () => {
    expect(formatDate(iso)).toBe("14.07.2026");
  });

  it("formatTime → TR saati (UTC+3)", () => {
    expect(formatTime(iso)).toBe("20:00");
  });

  it("formatTimeRange → başlangıç – bitiş", () => {
    const end = "2026-07-14T18:30:00.000Z"; // TR 21:30
    expect(formatTimeRange(iso, end)).toBe("20:00 – 21:30");
  });

  it("gece yarısı UTC → ertesi gün TR", () => {
    // UTC 22:00 14 Tem → TR 01:00 15 Tem (tarih kayması doğru olmalı)
    const lateUtc = "2026-07-14T22:00:00.000Z";
    expect(formatDate(lateUtc)).toBe("15.07.2026");
    expect(formatTime(lateUtc)).toBe("01:00");
  });
});
