import type { MeDashboard } from "@/lib/public-api";

/** "Bana özel deneme" kartının çizim durumu (Doc 46). */
export interface PersonalExamState {
  /** Hak sınırsız mı (premium ya da bilgi yoksa). */
  sinirsiz: boolean;
  /** Bugün kalan hak; sınırsızsa null. */
  kalan: number | null;
  /** Bir denemenin soru tavanı. */
  tavan: number;
  /** Bugünlük hak bitti mi — kart Premium'a yönlendirir. */
  hakkiBitti: boolean;
  /** Seçilebilir soru uzunlukları (tavanın üstü kilitli gösterilir). */
  secenekler: { sayi: number; kilitli: boolean; birincil: boolean }[];
}

/** Kartta sunulan uzunluklar — gerçek format 100, kısa turlar 25/50. */
export const KISISEL_DENEME_UZUNLUKLARI = [25, 50, 100] as const;

/**
 * Hak bilgisinden kart durumunu türetir.
 *
 * Arayüz bir kural motoru DEĞİLDİR: asıl kapı sunucudadır (startPersonalExam).
 * Burası yalnız o kararı önceden dürüstçe göstermek içindir — bilgi yoksa
 * (dashboard çekilemedi, eski sunucu) kart kısıtsız çizilir ve kullanıcı
 * gerekirse sunucunun cevabıyla karşılaşır. Sessizce kilitlemek, hakkı olan
 * kullanıcıyı ürününden etmek olurdu.
 */
export function personalExamState(dashboard: MeDashboard | null): PersonalExamState {
  const hak = dashboard?.personalExam ?? null;
  const sinirsiz = hak == null || hak.dailyAllowance == null;
  const kalan = sinirsiz ? null : Math.max(0, hak!.dailyAllowance! - hak!.usedToday);
  const tavan = hak?.maxQuestions ?? 100;
  // Tavanın altındaki en uzun seçenek birincil buton olur: ücretsiz planda 25,
  // premium'da 100 — vurgulanan eylem hep gerçekten açılabilen eylemdir.
  const enUzunAcik = Math.max(
    ...KISISEL_DENEME_UZUNLUKLARI.filter((n) => n <= tavan),
    KISISEL_DENEME_UZUNLUKLARI[0],
  );
  return {
    sinirsiz,
    kalan,
    tavan,
    hakkiBitti: kalan === 0,
    secenekler: KISISEL_DENEME_UZUNLUKLARI.map((sayi) => ({
      sayi,
      kilitli: sayi > tavan,
      birincil: sayi === enUzunAcik,
    })),
  };
}
