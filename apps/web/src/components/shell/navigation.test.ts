import { describe, expect, it } from "vitest";
import { activeNavItem, APP_NAV_ITEMS, isNavItemActive } from "./navigation";

describe("uygulama navigasyonu", () => {
  it.each([
    ["/bugun", "Bugün"],
    ["/kutuphane/favoriler", "Kütüphane"],
    ["/kanun/cmk", "Kütüphane"],
    ["/sonuc/attempt-1", "Denemeler"],
    ["/performans/konu-haritasi", "Performans"],
    ["/profil/ayarlar", "Ben"],
  ])("%s rotasını %s bölümüne bağlar", (pathname, label) => {
    expect(activeNavItem(pathname).label).toBe(label);
  });

  it("benzer isimli ama bölge dışı rotayı aktif saymaz", () => {
    const profile = APP_NAV_ITEMS.find((item) => item.href === "/profil")!;
    expect(isNavItemActive(profile, "/profilimsi")).toBe(false);
  });
});
