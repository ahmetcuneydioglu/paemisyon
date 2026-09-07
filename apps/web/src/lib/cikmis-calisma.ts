/**
 * Çıkmış sınav çalışma modu ilerlemesi — TARAYICIDA saklanır (Doc 36, 7 Eyl 2026).
 *
 * Çalışma modu sunucuda oturum açmaz (değerlendirme istemcide), bu yüzden
 * sayfadan çıkınca ilerleme kayboluyordu: 5 soru çözüp geri dönen aday
 * sıfırdan başlıyordu. 100 soruluk bir sette bu kabul edilemez.
 *
 * Neden sunucuda değil: bu bir ÖLÇÜM değil, kişisel bir okuma durumu.
 * Sunucuya yazmak oturum açmayı ve kota/puan sorularını geri getirirdi.
 * Yanlışlar zaten sunucudaki çalışma defterine ayrıca yazılıyor.
 *
 * Anahtar biçimi mobildekiyle aynı (`cikmis_calisma_v1_<slug>`) — iki istemci
 * ayrı depolarda çalışır ama aynı dili konuşur.
 */

export const CALISMA_ONEK = "cikmis_calisma_v1_";

export function calismaAnahtari(slug: string): string {
  return `${CALISMA_ONEK}${slug}`;
}

/** {sıra: şık harfi} — bozuk/eski kayıt sayfayı bozmaz, boş döner. */
export function cozCalisma(ham: string | null | undefined): Record<number, string> {
  if (!ham) return {};
  try {
    const j: unknown = JSON.parse(ham);
    if (!j || typeof j !== "object" || Array.isArray(j)) return {};
    const out: Record<number, string> = {};
    for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
      const sira = Number.parseInt(k, 10);
      if (Number.isInteger(sira) && typeof v === "string" && v.length > 0) {
        out[sira] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function kodlaCalisma(secim: Record<number, string>): string {
  return JSON.stringify(secim);
}
