import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { CikmisSinavDetay } from "@/lib/public-api";
import { SinavQuiz } from "@/components/cikmis/sinav-quiz";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="type-title text-ink">{sinav.ad}</h1>
        <p className="type-body-sm text-ink-soft">
          Sınavın tamamı — {sinav.sorular.length} soru, cevaplarıyla ve
          dayanaklarıyla. Süre tutarak çözmek istersen sınav modunu seç.
        </p>
        {/* Durumuna göre: yarım sınav varsa devam, bitirdiyse önce sonucu.
            Ekran durumu bilmeden "Sınav gibi çöz" diyordu ve sınavı bitirmiş
            biri dokununca SESSİZCE sıfırdan yeni sınav başlıyordu
            (7 Eyl 2026 bildirimi). Tekrar çözmek meşru ama bilerek seçilmeli. */}
        {sinav.examId && (
          <div className="flex flex-wrap gap-2 pt-1">
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
          <Card tone="accent" className="flex flex-col gap-3 p-5">
            <h3 className="type-heading text-ink">Sınavın tamamını gördün</h3>
            <p className="type-body-sm max-w-[60ch] text-ink-soft">
              Aynı seti süre tutarak çözmek netini gösterir; yanlışların çalışma
              defterine düşer.
            </p>
            {sinav.examId && (
              <div>
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
      <Card className="w-full p-6">
        <EmptyState
          icon={Lock}
          title="Premium çıkmış sınav"
          body={mesaj}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/premium">Premium&apos;a geç</ButtonLink>
              <ButtonLink href="/paem-cikmis-sorular" variant="secondary">
                Diğer dönemler
              </ButtonLink>
            </div>
          }
        />
      </Card>
    </div>
  );
}
