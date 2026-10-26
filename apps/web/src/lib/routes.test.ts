import { describe, expect, it } from "vitest";
import { bildirimRotasi, webRoute } from "./routes";

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

describe("bildirimRotasi", () => {
  const sid = "4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";

  it("sunucunun eğik çizgisiz push sözlüğünü çevirir", () => {
    // 26 Eki 2026 öncesi bunların hepsi /bugun'a düşüyordu.
    expect(bildirimRotasi("daily-quiz")).toBe("/seans?mode=daily&source=notif");
    expect(bildirimRotasi("denemeler")).toBe("/denemeler");
    expect(bildirimRotasi("leaderboard")).toBe("/liderlik");
    expect(bildirimRotasi(`deneme-sonuc/${sid}`)).toBe(`/sonuc/${sid}`);
    expect(bildirimRotasi(`question:${sid}`)).toBe(
      `/seans?mode=practice&questionId=${sid}&count=1&source=notif`,
    );
  });

  it("koç kartı yollarını webRoute ile çevirir", () => {
    expect(bildirimRotasi("/quiz")).toBe("/seans");
    expect(bildirimRotasi("/denemeler/cikmis")).toBe("/paem-cikmis-sorular");
    expect(bildirimRotasi("/profil")).toBe("/profil");
  });

  it("boş, bilinmeyen ve bozuk değerler Bugün'e düşer", () => {
    expect(bildirimRotasi("")).toBe("/bugun");
    expect(bildirimRotasi(undefined)).toBe("/bugun");
    expect(bildirimRotasi("deneme-sonuc/bozuk")).toBe("/bugun");
    expect(bildirimRotasi("question:bozuk")).toBe("/bugun");
    expect(bildirimRotasi("bilinmeyen")).toBe("/bugun");
  });

  it("açık yönlendirme girişimlerini reddeder", () => {
    expect(bildirimRotasi("//evil.com")).toBe("/bugun");
    expect(bildirimRotasi("/\\evil.com")).toBe("/bugun");
    expect(bildirimRotasi("https://evil.com")).toBe("/bugun");
  });
});

describe("webRoute — zayıf konu / ünite reçetesi (Doc 53 F5-3)", () => {
  it("meta.topicId varsa /quiz konuya kapsamlı seansa gider", () => {
    const h = webRoute("/quiz", "weak_topic", { topicId: "t1", topicName: "T.C. Anayasası" });
    expect(h.startsWith("/seans?")).toBe(true);
    expect(h).toContain("topicId=t1");
    expect(h).toContain("source=home_weak_topic");
    expect(h).not.toContain("articleNos");
  });
  it("reçete varsa ünitenin maddeleri de gider", () => {
    const h = webRoute("/quiz", "weak_topic", { topicId: "t1", topicName: "Anayasa", recipe: { session: { topicId: "t1", articleNos: ["75", "76"], count: 10 } } });
    expect(h).toContain("articleNos=75%2C76");
    expect(h).toContain("count=10");
  });
  it("özet rotası olduğu gibi geçer; meta'sız /quiz eski davranış", () => {
    expect(webRoute("/ozet/anayasa-yasama-1", "weak_topic", { topicId: "t1" })).toBe("/ozet/anayasa-yasama-1");
    expect(webRoute("/quiz")).toBe("/seans");
  });
});
