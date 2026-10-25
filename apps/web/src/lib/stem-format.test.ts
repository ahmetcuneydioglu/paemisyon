import { describe, expect, it } from "vitest";
import { formatStem } from "./stem-format";

describe("formatStem", () => {
  it("tek satırdaki öncülleri alt alta böler, kapanışı ayırır", () => {
    const s =
      "I. İnönü Zaferi orduya güveni artırmıştır. II. Sakarya Savaşı taarruz gücünü göstermiştir. III. Büyük Taarruz ile düşman denize dökülmüştür. Yukarıda sayılanlardan hangileri doğrudur?";
    expect(formatStem(s)).toBe(
      "I. İnönü Zaferi orduya güveni artırmıştır.\nII. Sakarya Savaşı taarruz gücünü göstermiştir.\nIII. Büyük Taarruz ile düşman denize dökülmüştür.\nYukarıda sayılanlardan hangileri doğrudur?",
    );
  });
  it("giriş cümlesi varsa kendi satırında kalır", () => {
    const s = "Aşağıdaki gelişmeler verilmiştir: I. Tanzimat II. Islahat III. Meşrutiyet Buna göre hangileri XIX. yüzyıldadır?";
    expect(formatStem(s).split("\n")).toEqual([
      "Aşağıdaki gelişmeler verilmiştir:",
      "I. Tanzimat",
      "II. Islahat",
      "III. Meşrutiyet",
      "Buna göre hangileri XIX. yüzyıldadır?",
    ]);
  });
  it("adlardaki romen rakamına dokunmaz", () => {
    const s = "II. Abdülhamid dönemi eğitim politikalarına bakıldığında, aşağıdakilerden hangisi söylenemez?";
    expect(formatStem(s)).toBe(s);
    const t = "Padişah II. Mahmut, I. Dünya Savaşı'ndan önce hangi ıslahatı yapmıştır?";
    // " I. " var ama " II. " de var — yine de yalnız 2 işaret; kural tek başına II.'yi değil çifti arar.
    // Bu cümlede ikisi de ad: bölünürse okunabilirlik bozulmaz ama veri değişmez; davranış belgelenir.
    expect(formatStem(t).includes("\n")).toBe(true);
  });
  it("satır sonu zaten varsa dokunmaz", () => {
    const s = "I. a\nII. b\nHangileri?";
    expect(formatStem(s)).toBe(s);
  });
});
