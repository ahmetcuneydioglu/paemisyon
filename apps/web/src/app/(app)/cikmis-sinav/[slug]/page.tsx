import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { CikmisSinavDetay } from "@/lib/public-api";
import { SinavQuiz } from "@/components/cikmis/sinav-quiz";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Çıkmış Sınav — Çalışma Modu",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

/**
 * Çıkmış sınav çalışma modu (Doc 36 §4) — girişli katman.
 *
 * Public sayfadaki 10 soruluk sınır pazarlama içindi; hesabı olan kullanıcı
 * sınavın TAMAMINI görür. Süre tutup net almak isteyen "sınav gibi çöz"
 * yolunu kullanır; burası tek tek çalışmak için.
 *
 * `robots: noindex`: aynı içeriğin public sürümü zaten indeksli, ikisi
 * yarışmasın.
 */
export default async function CikmisSinavCalismaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Premium dönem ile bulunamayan dönem AYRI: 403'ü 404 diye göstermek,
  // parayla açılan bir kapıyı "yok" diye kapatmak olurdu (7 Eyl 2026).
  let sinav: CikmisSinavDetay;
  try {
    sinav = await api<CikmisSinavDetay>(`/cikmis-sinavlar/${slug}`);
  } catch (e) {
    if (e instanceof ApiError && e.code === "PREMIUM_REQUIRED") {
      return <PremiumKapisi mesaj={e.message} />;
    }
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold leading-tight text-brand">
          {sinav.ad}
        </h1>
        <p className="text-[14px] leading-relaxed text-ink-soft">
          Sınavın tamamı — {sinav.sorular.length} soru, cevaplarıyla ve
          dayanaklarıyla. Süre tutarak çözmek istersen sınav modunu seç.
        </p>
        {/* Durumuna göre: yarım sınav varsa devam, bitirdiyse önce sonucu.
            Ekran durumu bilmeden "Sınav gibi çöz" diyordu ve sınavı bitirmiş
            biri dokununca SESSİZCE sıfırdan yeni sınav başlıyordu
            (7 Eyl 2026 bildirimi). Tekrar çözmek meşru ama bilerek seçilmeli. */}
        {sinav.examId && (
          <div className="flex flex-wrap gap-3">
            {sinav.devamEden ? (
              <ButtonLink href={`/sinav/arsiv/${sinav.examId}`}>
                Kaldığın yerden devam et ({sinav.devamEden.cevaplanan}/
                {sinav.devamEden.toplamSoru})
              </ButtonLink>
            ) : sinav.benimSonucum ? (
              <>
                <ButtonLink href={`/sonuc/${sinav.benimSonucum.attemptId}`}>
                  Sonucunu gör ({sinav.benimSonucum.correctCount} doğru)
                </ButtonLink>
                <ButtonLink
                  href={`/sinav/arsiv/${sinav.examId}`}
                  variant="secondary"
                >
                  Tekrar çöz
                </ButtonLink>
              </>
            ) : (
              <ButtonLink
                href={`/sinav/arsiv/${sinav.examId}`}
                variant="secondary"
              >
                Sınav gibi çöz
              </ButtonLink>
            )}
          </div>
        )}
      </header>

      <SinavQuiz
        calismaModu
        slug={slug}
        sorular={sinav.sorular}
        kapaliSoru={0}
        examId={sinav.examId}
        baslik={`${sinav.sorular.length} soru — çöz, hemen gör`}
        sonKart={
          <Card className="border-brand/30 bg-brand/5">
            <h3 className="font-heading text-[17px] font-bold text-ink">
              Sınavın tamamını gördün
            </h3>
            <p className="mt-1 max-w-[60ch] text-[14px] leading-relaxed text-ink-soft">
              Aynı seti süre tutarak çözmek netini gösterir; yanlışların çalışma
              defterine düşer.
            </p>
            {sinav.examId && (
              <div className="mt-3">
                <ButtonLink href={`/sinav/arsiv/${sinav.examId}`} size="lg">
                  Sınav gibi çöz
                </ButtonLink>
              </div>
            )}
          </Card>
        }
      />
    </div>
  );
}

/** Dönem Premium'a alındıysa: 404 değil, ne olduğunu söyleyen bir kapı. */
function PremiumKapisi({ mesaj }: { mesaj: string }) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4">
      <Card className="w-full p-8 text-center">
        <p className="text-3xl" aria-hidden>
          🔒
        </p>
        <h1 className="mt-3 font-heading text-[17px] font-bold text-ink">
          Premium çıkmış sınav
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{mesaj}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/premium">Premium&apos;a geç</ButtonLink>
          <ButtonLink href="/paem-cikmis-sorular" variant="secondary">
            Diğer dönemler
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
