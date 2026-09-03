import { describe, expect, it } from "vitest";
import { alanAdi, alanOnerisi, duzenlemeUzakligi, epostaDenetle } from "./eposta";

describe("epostaDenetle — geçerli adresler", () => {
  // Bu liste kuralın GEVŞEK kalmasını korur: buradan biri düşerse gerçek bir
  // kullanıcı kapıda kalıyor demektir.
  it.each([
    "adin@gmail.com",
    "ahmet+deneme@gmail.com", // artı adresleme
    "a.b-c_d@hotmail.com",
    "kullanici@sirket.com.tr",
    "biri@marka.istanbul", // uzun uzantı
    "üye@köşe.com", // IDN
    "x9y@mail.superonline.com",
    "abc123@privaterelay.appleid.com", // Apple ile giriş — asla engellenmemeli
    "takma@passinbox.com", // meşru takma-adres servisi
  ])("geçer: %s", (e) => expect(epostaDenetle(e).durum).toBe("gecerli"));
});

describe("epostaDenetle — biçim", () => {
  it.each(["", "   ", "adin", "adin@", "@gmail.com", "a b@gmail.com", "adin@gmail"])(
    "reddeder: %s",
    (e) => expect(epostaDenetle(e).durum).toBe("gecersiz"),
  );
});

describe("epostaDenetle — posta alamayacağı kesin alanlar", () => {
  it.each([
    "yuk-test-1@paemisyon.test",
    "biri@sunucu.local",
    "biri@makine.localhost",
    "biri@example.com",
  ])("reddeder: %s", (e) => expect(epostaDenetle(e).durum).toBe("gecersiz"));
});

describe("epostaDenetle — yazım hatası önerisi", () => {
  it.each([
    ["adin@gmial.com", "adin@gmail.com"], // harf takası
    ["adin@gmai.com", "adin@gmail.com"], // eksik harf
    ["adin@hotmial.com", "adin@hotmail.com"],
    ["adin@outlok.com", "adin@outlook.com"],
    ["adin@icloud.co", "adin@icloud.com"],
  ])("%s → %s önerir", (girdi, beklenen) => {
    const s = epostaDenetle(girdi);
    expect(s.durum).toBe("oneri");
    if (s.durum === "oneri") expect(s.oneri).toBe(beklenen);
  });

  it("adresin kullanıcı kısmını korur", () => {
    const s = epostaDenetle("ahmet+etiket@gmial.com");
    if (s.durum !== "oneri") throw new Error("öneri bekleniyordu");
    expect(s.oneri).toBe("ahmet+etiket@gmail.com");
  });

  it("tanımadığı kurumsal alan adına karışmaz", () => {
    expect(epostaDenetle("memur@egm.gov.tr").durum).toBe("gecerli");
    expect(epostaDenetle("biri@sirketim.com").durum).toBe("gecerli");
  });

  it("kısa alan adlarında cömert davranmaz", () => {
    // "mail.com" gerçek bir sağlayıcı; "gmail.com"a 1 harf uzak diye
    // düzeltilmeye kalkılmamalı.
    expect(alanOnerisi("mail.com")).toBeNull();
  });
});

describe("duzenlemeUzakligi", () => {
  it("bitişik harf takasını tek işlem sayar", () => {
    expect(duzenlemeUzakligi("gmial", "gmail")).toBe(1);
  });
  it("aynı metinde sıfırdır", () => {
    expect(duzenlemeUzakligi("gmail.com", "gmail.com")).toBe(0);
  });
});

describe("alanAdi", () => {
  it("son @ işaretinden sonrasını küçük harfle verir", () => {
    expect(alanAdi("Ahmet@GMAIL.com")).toBe("gmail.com");
  });
});
