import { describe, expect, it } from "vitest";
import { calismaAnahtari, cozCalisma, kodlaCalisma } from "./cikmis-calisma";

/// Çalışma modu ilerlemesi tarayıcıda saklanır (7 Eyl 2026): sayfadan çıkıp
/// dönen aday sıfırdan başlıyordu.
describe("çıkmış sınav çalışma kaydı", () => {
  it("dönemler ayrı anahtarlarda tutulur", () => {
    expect(calismaAnahtari("paem-9-2025")).toBe("cikmis_calisma_v1_paem-9-2025");
    expect(calismaAnahtari("paem-8-2024")).not.toBe(
      calismaAnahtari("paem-9-2025"),
    );
  });

  it("yazılan ilerleme geri okunur", () => {
    const secim = { 9: "A", 10: "C" };
    expect(cozCalisma(kodlaCalisma(secim))).toEqual(secim);
  });

  it("100 soruluk set eksiksiz saklanır", () => {
    const tam = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [i + 1, "ABCDE"[(i + 1) % 5]]),
    );
    expect(cozCalisma(kodlaCalisma(tam))).toEqual(tam);
  });

  describe("bozuk kayıt sayfayı bozmaz", () => {
    it("geçersiz JSON", () => expect(cozCalisma("{bozuk")).toEqual({}));
    it("dizi", () => expect(cozCalisma("[1,2]")).toEqual({}));
    it("null", () => expect(cozCalisma(null)).toEqual({}));
    it("boş metin", () => expect(cozCalisma("")).toEqual({}));

    it("sayı olmayan anahtar atlanır, geçerliler kalır", () => {
      expect(cozCalisma('{"9":"A","abc":"B","10":"C"}')).toEqual({
        9: "A",
        10: "C",
      });
    });

    it("metin olmayan değer atlanır", () => {
      expect(cozCalisma('{"9":"A","10":5}')).toEqual({ 9: "A" });
    });
  });
});
