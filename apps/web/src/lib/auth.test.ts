import { describe, expect, it } from "vitest";
import { authRedirectUrl, safeNext } from "./auth";

describe("safeNext", () => {
  it("uygulama içi göreli yolları korur", () => {
    expect(safeNext("/profil/ayarlar?tab=hedef")).toBe(
      "/profil/ayarlar?tab=hedef",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "\\evil.example",
    " profil",
  ])("dış veya geçersiz yönlendirmeyi reddeder: %s", (value) =>
    expect(safeNext(value)).toBe("/bugun"),
  );

  it("callback adresine güvenli dönüş yolunu ekler", () => {
    expect(authRedirectUrl("https://paemisyon.com", "/profil")).toBe(
      "https://paemisyon.com/auth/callback?next=%2Fprofil",
    );
  });
});
