import { describe, expect, it } from "vitest";
import { webRoute } from "./routes";

describe("webRoute", () => {
  it("çıkmış sınav kartını TİPİNDEN tanıyıp vitrine götürür", () => {
    // Sunucu güvenli rota (/denemeler) gönderiyor: ekranı bilmeyen eski mobil
    // sürümler hata ekranı görmesin diye. Hedefi tip belirler (Doc 36 §7.2).
    expect(webRoute("/denemeler", "cikmis_sinav")).toBe("/paem-cikmis-sorular");
  });

  it("tip verilmeyince deneme rotası bozulmaz", () => {
    expect(webRoute("/denemeler")).toBe("/denemeler");
    expect(webRoute("/denemeler", "new_exam")).toBe("/denemeler");
  });

  it("çıkmış sınav rotası doğrudan gelirse de vitrine çevirir", () => {
    // Mobilde Denemeler sekmesinin altında (/denemeler/cikmis), webde kendi
    // sayfası var. Sıra önemli: "/denemeler" geçişi önce gelseydi bu adres
    // olduğu gibi geçip 404 verirdi.
    expect(webRoute("/denemeler/cikmis")).toBe("/paem-cikmis-sorular");
    expect(webRoute("/denemeler/cikmis/paem-9-2025")).toBe(
      "/paem-cikmis-sorular",
    );
  });

  it("diğer deneme rotaları olduğu gibi kalır", () => {
    expect(webRoute("/denemeler")).toBe("/denemeler");
    expect(webRoute("/denemeler/sonuc/a1")).toBe("/denemeler/sonuc/a1");
  });

  it("mobil rota adlarını web karşılıklarına çevirir", () => {
    expect(webRoute("/quiz")).toBe("/seans");
    expect(webRoute("/catalog")).toBe("/kanunlar");
    expect(webRoute("/review")).toContain("mode=review");
  });

  it("bilinmeyen rotayı bozmadan geçirir", () => {
    expect(webRoute("/profil")).toBe("/profil");
  });
});
