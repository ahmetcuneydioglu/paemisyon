import { describe, expect, it } from "vitest";
import { groupInbox, relativeTime, safeWebPath, type InboxItem } from "./notifications";

const now = new Date("2026-10-26T15:00:00+03:00");
const item = (id: string, iso: string): InboxItem => ({
  id, category: "exam", priority: "normal", title: "t", body: "b", imageUrl: null, ctaLabel: null, route: null,
  webPath: null, data: {}, readAt: null, openedAt: null, scheduledAt: iso, createdAt: iso,
});

describe("bildirim kutusu yardımcıları", () => {
  it("gün gruplarına ayırır", () => {
    const g = groupInbox(
      [item("a", "2026-10-26T13:00:00+03:00"), item("b", "2026-10-25T20:00:00+03:00"), item("c", "2026-10-22T09:00:00+03:00"), item("d", "2026-10-01T09:00:00+03:00")],
      now,
    );
    expect(g.map((x) => [x.label, x.items.length])).toEqual([["Bugün", 1], ["Dün", 1], ["Bu hafta", 1], ["Daha önce", 1]]);
  });

  it("göreli zaman", () => {
    expect(relativeTime("2026-10-26T14:59:40+03:00", now)).toBe("şimdi");
    expect(relativeTime("2026-10-26T14:40:00+03:00", now)).toBe("20 dk");
    expect(relativeTime("2026-10-26T12:00:00+03:00", now)).toBe("3 sa");
    expect(relativeTime("2026-10-25T12:00:00+03:00", now)).toBe("Dün");
  });

  it("güvenli web yolu", () => {
    expect(safeWebPath("/sonuc/abc")).toBe("/sonuc/abc");
    expect(safeWebPath("//evil.com")).toBe("/bugun");
    expect(safeWebPath(null)).toBe("/bugun");
  });
});
