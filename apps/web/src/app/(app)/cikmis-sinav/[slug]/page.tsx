import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
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
  const sinav = await api<CikmisSinavDetay>(`/cikmis-sinavlar/${slug}`).catch(
    () => null,
  );
  if (!sinav) notFound();

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
        {sinav.examId && (
          <ButtonLink href={`/sinav/arsiv/${sinav.examId}`} variant="secondary">
            Sınav gibi çöz
          </ButtonLink>
        )}
      </header>

      <SinavQuiz
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
