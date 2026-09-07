"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import {
  calismaAnahtari,
  cozCalisma,
  kodlaCalisma,
} from "@/lib/cikmis-calisma";
import type { CikmisSinavSoru } from "@/lib/public-api";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OptionRow, type OptionState } from "@/components/ui/option-row";
import { useLoggedIn } from "@/lib/auth/use-logged-in";

/**
 * Çıkmış sınav örneği — quiz olarak (Doc 36, kullanıcı kararı).
 *
 * Aday cevabı peşinen görmez: şıkka tıklar, doğru/yanlış anında belli olur ve
 * açıklama açılır. Soruları okuyup geçen ziyaretçi ile çözen ziyaretçi aynı
 * şey değil; ikincisi uygulamaya devam etme ihtimali olan kişidir.
 *
 * SEO dengesi: açıklama ve doğru şık HTML'e HER ZAMAN basılır, yalnız cevap
 * verilene kadar gizlenir. Sayfanın arama değeri tam olarak bu içerikte —
 * istemciye bırakılsa arama motoru boş sayfa görürdü. Bunun bedeli, kaynak
 * koda bakan birinin cevabı görebilmesi; bu sorular resmî anahtarıyla
 * yayımlanmış sınavlara ait olduğu için kabul edilebilir.
 */
export function SinavQuiz({
  sorular,
  kapaliSoru,
  examId,
  slug,
  baslik,
  sonKart,
  calismaModu = false,
}: {
  sorular: CikmisSinavSoru[];
  /** Uygulamada çözülebilen, burada gösterilmeyen soru sayısı. */
  kapaliSoru: number;
  examId: string | null;
  /** Girişli kullanıcıyı çalışma moduna götürmek için dönem slug'ı. */
  slug?: string;
  /**
   * Çalışma modu mu (girişli, sınavın TAMAMI)? Açıkken ilerleme tarayıcıda
   * saklanır ve yanlışlar çalışma defterine yazılır. Public tanıtım
   * sayfasında KAPALI: orada 10 soruluk bir vitrin var, defteri onunla
   * doldurmak yanlış olurdu (7 Eyl 2026).
   */
  calismaModu?: boolean;
  baslik?: string;
  /** Listenin sonundaki kart. Verilmezse public sayfanın çağrı-eylemi çıkar;
   *  çalışma modunda kayıt daveti anlamsız olduğu için oradan geçilir. */
  sonKart?: ReactNode;
}) {
  const girisli = useLoggedIn();
  const [secimler, setSecimler] = useState<Record<number, string>>({});
  // Çalışma modu ilerlemesi tarayıcıda saklanır: sayfadan çıkıp dönen aday
  // sıfırdan başlıyordu (7 Eyl 2026 bildirimi). Ölçüm değil kişisel bir okuma
  // durumu — sunucuya yazmak oturum açmayı ve kota sorularını geri getirirdi.
  const kayitAnahtari = calismaModu && slug ? calismaAnahtari(slug) : null;
  const yuklendi = useRef(false);

  useEffect(() => {
    if (!kayitAnahtari || yuklendi.current) return;
    yuklendi.current = true;
    try {
      const kayit = cozCalisma(localStorage.getItem(kayitAnahtari));
      // Kullanıcı bu arada bir şık işaretlediyse onunki kalır.
      if (Object.keys(kayit).length > 0) setSecimler((o) => ({ ...kayit, ...o }));
    } catch {
      // Depolama kapalıysa (gizli sekme vb.) çalışma yine sürer.
    }
  }, [kayitAnahtari]);
  const cevaplanan = Object.keys(secimler).length;
  const dogru = sorular.filter(
    (s) => secimler[s.sira] && secimler[s.sira] === s.siklar.find((x) => x.dogru)?.harf,
  ).length;
  const bitti = cevaplanan === sorular.length && sorular.length > 0;

  function isaretle(soru: CikmisSinavSoru, harf: string) {
    setSecimler((o) => {
      if (o[soru.sira]) return o; // ilk cevap kalır — deneye deneye bulunmaz
      const yeni = { ...o, [soru.sira]: harf };
      if (kayitAnahtari) {
        try {
          localStorage.setItem(kayitAnahtari, kodlaCalisma(yeni));
        } catch {
          // Depolama kapalıysa çalışma yine sürer, yalnız ilerleme saklanmaz.
        }
      }
      return yeni;
    });
    // Yanlışlar çalışma defterine (7 Eyl 2026): kota harcanmaz, puan işlemez;
    // doğruluğu SUNUCU belirler. Ateşle-unut — çalışmayı bloke etmez.
    const dogruHarf = soru.siklar.find((x) => x.dogru)?.harf;
    if (calismaModu && slug && harf !== dogruHarf && !soru.iptal) {
      void apiClient(`/cikmis-sinavlar/${slug}/calisma-yanlisi`, {
        method: "POST",
        body: { sira: soru.sira, harf },
      }).catch(() => {});
    }
  }

  function sifirla() {
    if (kayitAnahtari) {
      try {
        localStorage.removeItem(kayitAnahtari);
      } catch {
        // yok sayılır
      }
    }
    setSecimler({});
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-[19px] font-bold text-ink">
          {baslik ?? `Sınavdan ${sorular.length} soru — çöz, hemen gör`}
        </h2>
        <div className="flex items-baseline gap-3">
          <p className="tabular-nums text-[13px] text-ink-soft" aria-live="polite">
            {cevaplanan}/{sorular.length} cevaplandı
            {cevaplanan > 0 && ` · ${dogru} doğru`}
          </p>
          {kayitAnahtari && cevaplanan > 0 && (
            <button
              type="button"
              onClick={sifirla}
              className="text-[13px] font-bold text-ink-soft hover:text-ink hover:underline"
            >
              Baştan başla
            </button>
          )}
        </div>
      </div>
      <p className="max-w-[68ch] text-[14px] leading-relaxed text-ink-soft">
        Şıkka dokun, doğru mu yanlış mı anında gör. Her sorunun altında cevabın
        dayanağı var: hangi madde, neden o şık.
      </p>

      <ol className="space-y-3">
        {sorular.map((s) => (
          <li key={s.sira}>
            <SoruKarti
              soru={s}
              secim={secimler[s.sira]}
              onSecim={(harf) => isaretle(s, harf)}
            />
          </li>
        ))}
      </ol>

      {sonKart ?? (
      <Card className="border-brand/30 bg-brand/5">
        <h3 className="font-heading text-[17px] font-bold text-ink">
          {bitti
            ? `${sorular.length} soruda ${dogru} doğru`
            : `Kalan ${kapaliSoru} soru uygulamada`}
        </h3>
        <p className="mt-1 max-w-[60ch] text-[14px] leading-relaxed text-ink-soft">
          {bitti
            ? `Burada sınavın küçük bir parçası var. Kalan ${kapaliSoru} soruyu süre tutarak çöz, netini gör, yanlışların çalışma defterine düşsün.`
            : "Sınavın tamamını süre tutarak çöz, netini gör, yanlışların çalışma defterine düşsün. Her sorunun açıklaması ve kanun dayanağı hazır; iptal edilen sorular sete girmez, netini bozmaz."}
          {!girisli && " Ücretsiz hesap yeterli."}
        </p>
        {/* Girişli kullanıcıya "Ücretsiz başla" göstermek anlamsız — onu
            zaten yaptı. Tek kapı bırakılır: sınavın tamamı. */}
        <div className="mt-3 flex flex-wrap gap-2">
          {girisli && examId ? (
            <>
              <ButtonLink href={`/sinav/arsiv/${examId}`} size="lg">
                Sınav gibi çöz
              </ButtonLink>
              {slug && (
                <ButtonLink href={`/cikmis-sinav/${slug}`} size="lg" variant="secondary">
                  Tüm soruları çalış
                </ButtonLink>
              )}
            </>
          ) : (
            <ButtonLink href="/kayit" size="lg">
              {examId ? "Ücretsiz başla ve tamamını çöz" : "Ücretsiz başla"}
            </ButtonLink>
          )}
        </div>
      </Card>
      )}
    </section>
  );
}

/**
 * Bazı açıklamalar "Doğru cevap A." diye başlıyor (200 sorunun 17'si). Doğru
 * şıkkı geri bildirim satırı zaten söylediği için bu ön ek tekrara düşüyor;
 * yalnız gösterimde ayıklanır, bankadaki metne dokunulmaz.
 */
function aciklamayiSadelestir(t: string): string {
  return t.replace(/^(Doğru cevap|Cevap)\s*[:\-–]?\s*[A-E]\s*[.:,—-]?\s*/u, "").trim();
}

function SoruKarti({
  soru,
  secim,
  onSecim,
}: {
  soru: CikmisSinavSoru;
  secim?: string;
  onSecim: (harf: string) => void;
}) {
  const dogruHarf = soru.siklar.find((s) => s.dogru)?.harf;
  const cevaplandi = secim != null;
  const dogruMu = cevaplandi && secim === dogruHarf;

  const durum = (harf: string): OptionState => {
    if (!cevaplandi) return "idle";
    if (harf === dogruHarf) return "correct";
    if (harf === secim) return "wrong";
    return "dim";
  };

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-heading text-[13px] font-bold text-ink-soft">{soru.sira}.</span>
        <span className="rounded-sm bg-line/40 px-2 py-0.5 text-[12px] text-ink-soft">
          {soru.konu}
        </span>
        {soru.iptal && (
          <span className="rounded-sm bg-danger/10 px-2 py-0.5 text-[12px] font-bold text-danger ring-1 ring-danger/30">
            Sınavda iptal edildi
          </span>
        )}
      </div>

      <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{soru.kok}</p>

      {soru.gorselUrl && (
        <Image
          src={soru.gorselUrl}
          alt={`${soru.sira}. sorunun şekli`}
          width={800}
          height={400}
          className="h-auto w-full max-w-[520px] rounded-sm border border-line bg-white"
          unoptimized
        />
      )}

      <ul className="space-y-1.5">
        {soru.siklar.map((s) => (
          <li key={s.harf}>
            <OptionRow
              label={s.harf}
              text={s.metin}
              state={durum(s.harf)}
              disabled={cevaplandi}
              onSelect={() => onSecim(s.harf)}
            />
          </li>
        ))}
      </ul>

      {/* Açıklama HTML'de her zaman var; cevap verilene kadar gizli.
          Arama motoru içeriği görür, aday önce kendi dener. */}
      <div
        hidden={!cevaplandi}
        className="rounded-md border border-line bg-line/20 p-3"
        aria-live="polite"
      >
        <p
          className={[
            "font-heading text-[15px] font-bold",
            dogruMu ? "text-success" : "text-danger",
          ].join(" ")}
        >
          {dogruMu ? "✓ Doğru" : `✗ Yanlış — doğru cevap ${dogruHarf}`}
        </p>
        {soru.aciklama && (
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">
            {aciklamayiSadelestir(soru.aciklama)}
          </p>
        )}
        {soru.dayanak.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {soru.dayanak.map((d) => (
              <li key={d.baslik} className="text-[13px] text-ink-soft">
                {d.url ? (
                  <a
                    href={d.url}
                    className="tk-interactive underline underline-offset-2 hover:text-ink"
                    rel="nofollow noopener"
                    target="_blank"
                  >
                    {d.baslik}
                  </a>
                ) : (
                  d.baslik
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
