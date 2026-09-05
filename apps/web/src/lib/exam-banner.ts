import type { ExamListItem } from "@/lib/types";

const TZ = "Europe/Istanbul";

/** Verilen anın TR takvimindeki günü (YYYY-AA-GG). */
function trGun(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/**
 * Şerit başlığı: "Bugün" / "Yarın" / nötr.
 *
 * 24 saatlik eşik tek başına "Bugün" demeye yetmez — gece yarısından sonra
 * başlayan bir deneme 20 saat uzakta olsa bile YARIN'dır. Karşılaştırma TR
 * takvim gününe göre yapılır; sunucu UTC'de çalıştığı için ham tarih
 * karşılaştırması yanlış gün üretirdi.
 */
export function baslangicEtiketi(startAtIso: string, now = Date.now()): "Bugün" | "Yarın" | null {
  const gun = trGun(new Date(startAtIso).getTime());
  if (gun === trGun(now)) return "Bugün";
  if (gun === trGun(now + 24 * 60 * 60 * 1000)) return "Yarın";
  return null;
}

/**
 * Canlı deneme duyuru şeridinin eşiği — saf mantık (bileşenden ayrı, test edilir).
 *
 * Eşik bilinçli: yalnız CANLI ya da 24 saat içinde başlayacak deneme şerit olur.
 * Şerit sayfanın en üstünü işgal ediyor; haftaya olan bir deneme için sürekli
 * açık kalırsa gürültüye döner ve gerçekten acil olduğunda görünmez olur.
 */
/** Şeridin çıkması gereken deneme (canlı > 24 saat içinde başlayan). */
export function bannerExam(exams: ExamListItem[], now = Date.now()): ExamListItem | null {
  const live = exams.find((e) => e.state === "active");
  if (live) return live;
  const soon = exams
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  if (!soon) return null;
  const kalan = +new Date(soon.startAt) - now;
  return kalan <= 24 * 60 * 60 * 1000 ? soon : null;
}
