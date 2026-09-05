import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/format";
import type { ExamListItem } from "@/lib/types";
import { baslangicEtiketi } from "@/lib/exam-banner";
export { bannerExam } from "@/lib/exam-banner";

/**
 * Canlı deneme duyuru şeridi.
 *
 * Neden var: 5 Eylül 2026 denemesine 152 kullanıcıdan yalnız 6'sı katıldı.
 * Sebep sistem değil ERİŞİM'di — push yalnız 17 mobil cihaza gidiyor (web'de
 * push altyapısı yok) ve bildirim sınav başladıktan 9 dakika SONRA çıktı.
 * Bugün ekranındaki "sıradaki deneme" kartı ise sağ kolonun dibinde, rozet
 * çubuğunun altında, 13px yazıyla duruyordu; mobil webde ekranın çok
 * aşağısındaydı. Bu şerit izin gerektirmeyen tek duyuru kanalıdır: o gün
 * uygulamayı açan HERKES görür.
 *
 * Eşik bilinçli: yalnız CANLI ya da 24 saat içinde başlayacak deneme şerit
 * olur. Haftaya olan bir deneme için sayfanın en üstünü işgal etmek, şeridi
 * gürültüye çevirir ve gerçekten acil olduğunda görünmez kılar.
 */

export function ExamBanner({ exam }: { exam: ExamListItem }) {
  const canli = exam.state === "active";
  // Katılmış kullanıcıyı "Hemen katıl" ile kandırmayalım: sonucuna yönlendir.
  const katildi = exam.myAttempt?.status === "completed";
  const gun = baslangicEtiketi(exam.startAt);

  return (
    <section
      aria-labelledby="deneme-serit-baslik"
      className={[
        "mb-4 rounded-md border p-4 sm:p-5",
        canli ? "border-live/50 bg-live/10" : "border-brand/40 bg-brand/5",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <span
            className={[
              "tk-caption inline-flex items-center gap-1.5",
              canli ? "text-live" : "text-brand",
            ].join(" ")}
          >
            {canli && (
              <span
                aria-hidden
                className="inline-block size-2 rounded-full bg-live motion-safe:animate-pulse"
              />
            )}
            {canli
              ? "Canlı deneme sürüyor"
              : gun
                ? `${gun} canlı deneme var`
                : "Yaklaşan canlı deneme"}
          </span>

          <h2
            id="deneme-serit-baslik"
            className="mt-1 font-heading text-lg font-bold leading-snug text-ink"
          >
            {exam.title}
          </h2>

          <p className="tabular mt-1 text-[13px] text-ink-soft">
            {canli ? (
              <>
                {exam.questionCount} soru · {exam.durationMinutes} dk ·{" "}
                {exam.participantCount > 0
                  ? `${exam.participantCount} kişi katıldı`
                  : "ilk katılan sen ol"}
              </>
            ) : (
              <>
                {formatTime(exam.startAt)}
                {gun == null && ` · ${formatDate(exam.startAt)}`} · {exam.questionCount} soru ·{" "}
                {exam.durationMinutes} dk
              </>
            )}
          </p>

          {!canli && (
            <p className="mt-1 text-[13px] font-bold text-ink">
              Başlamasına <Countdown target={exam.startAt} variant="inline" />
            </p>
          )}
        </div>

        {/* Düğme kendi satırında da olsa HER ZAMAN görünür: sayaç eskiden
            sağ grupta duruyordu ve mobilde çağrı düğmesini ekran dışına
            itiyordu (375px'te 4 kutulu sayaç tek başına ~330px). */}
        <ButtonLink
          href="/denemeler"
          size="lg"
          variant={canli ? "primary" : "secondary"}
          className="shrink-0"
        >
          {katildi ? "Sonucuma bak" : canli ? "Hemen katıl" : "Denemeye git"}
        </ButtonLink>
      </div>

      {exam.isPremium && (
        <p className="mt-3 text-[12px] text-ink-soft">
          Bu deneme premium üyelere özeldir.{" "}
          <Link href="/premium" className="font-bold text-brand hover:underline">
            Premium&apos;a geç
          </Link>
        </p>
      )}
    </section>
  );
}
