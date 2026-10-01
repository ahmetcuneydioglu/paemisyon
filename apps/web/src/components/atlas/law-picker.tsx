"use client";

import { useMemo, useState } from "react";
import { LawCardBody, LawCardGrid } from "@/components/atlas/law-card";
import { MixedLawSessionCard } from "@/components/atlas/mixed-law-session-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectableCard } from "@/components/ui/selectable-card";
import type { LawSummary } from "@/lib/public-api";

const ADETLER = [10, 15, 25] as const;
type Adet = (typeof ADETLER)[number];
const EN_AZ_MEVZUAT = 2;

/** Son seçim tarayıcıda hatırlanır — "geçen seferki kanunlarla devam" kolay olsun. */
function depoAnahtari(courseId: string) {
  return `paemisyon.secili-mevzuat.${courseId}`;
}

function depodanOku(courseId: string): string[] {
  try {
    const ham = localStorage.getItem(depoAnahtari(courseId));
    const liste: unknown = ham ? JSON.parse(ham) : null;
    return Array.isArray(liste) ? liste.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return []; // gizli sekme / depolama kapalı — boş başla
  }
}

function depoyaYaz(courseId: string, secili: string[]) {
  try {
    localStorage.setItem(depoAnahtari(courseId), JSON.stringify(secili));
  } catch {
    /* depolama kapalı — yalnız bu oturumda yaşar */
  }
}

/**
 * Kanun seçici — tek kanun ile tüm ders arasındaki kapsam (1 Eki 2026,
 * kullanıcı talebi): aday çalıştığı kanunları işaretler, yalnız onlardan
 * dengeli karışık tur çözer. Kural sunucuda (`topicIds`); burası yalnız
 * seçimi toplar ve /seans'a taşır. Gezinme modunda kütüphane ızgarası
 * olduğu gibi kalır; seçim modunda aynı kart gövdesi seçilebilir yüzeye biner.
 */
export function LawPicker({
  courseId,
  courseName,
  laws,
}: {
  courseId: string;
  courseName: string;
  laws: LawSummary[];
}) {
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<string[]>([]);
  const [adet, setAdet] = useState<Adet>(15);

  const sirali = useMemo(
    () => [...laws].sort((a, b) => b.questionCount - a.questionCount),
    [laws],
  );
  const toplamSoru = laws.reduce((t, l) => t + l.questionCount, 0);

  // Seçim modu açılırken son seçim depodan yüklenir (effect değil, eylem
  // anında: sunucu çıktısıyla ilk boyama aynı kalır, hidrasyon farkı doğmaz).
  // Kütüphaneden kalkmış konular sessizce düşer.
  const secimModunuDegistir = () => {
    if (!secimModu) {
      const gecerli = new Set(laws.map((l) => l.topicId));
      setSecili(depodanOku(courseId).filter((id) => gecerli.has(id)));
    }
    setSecimModu(!secimModu);
  };

  const seciliKume = useMemo(() => new Set(secili), [secili]);
  const seciliSoru = laws
    .filter((l) => seciliKume.has(l.topicId))
    .reduce((t, l) => t + l.questionCount, 0);
  const count = Math.min(adet, seciliSoru);
  const baslatilabilir = secili.length >= EN_AZ_MEVZUAT && seciliSoru > 0;
  const kapsamEtiketi = `${courseName} · ${secili.length} mevzuat`;
  const href = `/seans?topicIds=${secili.join(",")}&count=${count}&scope=${encodeURIComponent(kapsamEtiketi)}`;

  const degistir = (topicId: string) => {
    setSecili((onceki) => {
      const sonraki = onceki.includes(topicId)
        ? onceki.filter((x) => x !== topicId)
        : [...onceki, topicId];
      depoyaYaz(courseId, sonraki);
      return sonraki;
    });
  };

  const temizle = () => {
    setSecili([]);
    depoyaYaz(courseId, []);
  };

  return (
    <div className={secimModu ? "pb-32" : ""}>
      <MixedLawSessionCard
        courseId={courseId}
        courseName={courseName}
        lawCount={laws.length}
        questionCount={toplamSoru}
        secondaryAction={
          <Button
            type="button"
            variant="secondary"
            size="lg"
            aria-pressed={secimModu}
            onClick={secimModunuDegistir}
            className="w-full sm:w-auto"
          >
            {secimModu ? "Seçimi kapat" : "Kanun seçerek çöz"}
          </Button>
        }
      />

      {secimModu ? (
        <>
          <p className="mb-3 text-[13px] leading-relaxed text-ink-soft" id={`secim-aciklama-${courseId}`}>
            Çalıştığın kanunları işaretle; tur yalnız onlardan, kanunlar arasında dengeli kurulur.
            En az {EN_AZ_MEVZUAT} kanun seç.
            {secili.length > 0 && " Son seçimin hatırlandı."}
          </p>
          <div
            role="group"
            aria-describedby={`secim-aciklama-${courseId}`}
            aria-label={`${courseName} kanun seçimi`}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {sirali.map((l) => (
              <SelectableCard
                key={l.slug}
                accent="atlas"
                selected={seciliKume.has(l.topicId)}
                disabled={l.questionCount === 0}
                disabledHint="Henüz çıkmış soru yok"
                onToggle={() => degistir(l.topicId)}
                label={l.name}
              >
                <LawCardBody law={l} />
              </SelectableCard>
            ))}
          </div>

          {/* Yapışkan özet çubuğu — seçim ne kadar uzun olursa olsun eylem elin altında. */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-card backdrop-blur">
            {/* Telefonda iki satır (özet + eylemler), geniş ekranda tek satır —
                çubuk içeriği örtmesin diye kompakt tutulur. */}
            <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] text-ink" aria-live="polite">
                  {secili.length < EN_AZ_MEVZUAT ? (
                    <>
                      <strong>{secili.length} mevzuat</strong> seçildi · en az {EN_AZ_MEVZUAT}{" "}
                      kanun gerekir
                    </>
                  ) : (
                    <>
                      <strong>{secili.length} mevzuat</strong> · {seciliSoru} çıkmış soru ·{" "}
                      {count} soruluk tur
                    </>
                  )}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={temizle}
                  disabled={secili.length === 0}
                  // Küçük görünür, ≥44pt dokunur (min-height, height'ı ezer).
                  className="min-h-11 sm:hidden"
                >
                  Temizle
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <SegmentedControl<Adet>
                  label="Soru sayısı"
                  accent="atlas"
                  value={adet}
                  onChange={setAdet}
                  options={ADETLER.map((a) => ({ value: a, label: String(a) }))}
                />
                {/* Telefonda kısa etiket (satır kırılmasın); geniş ekranda tam ad. */}
                {baslatilabilir ? (
                  <ButtonLink
                    href={href}
                    variant="atlas"
                    size="lg"
                    className="flex-1 whitespace-nowrap sm:flex-none"
                  >
                    <span className="sm:hidden">Çözmeye başla</span>
                    <span className="max-sm:hidden">Seçili mevzuattan çöz</span>
                    <span aria-hidden>→</span>
                  </ButtonLink>
                ) : (
                  <Button
                    type="button"
                    variant="atlas"
                    size="lg"
                    disabled
                    className="flex-1 whitespace-nowrap sm:flex-none"
                  >
                    <span className="sm:hidden">Çözmeye başla</span>
                    <span className="max-sm:hidden">Seçili mevzuattan çöz</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={temizle}
                  disabled={secili.length === 0}
                  className="max-sm:hidden"
                >
                  Temizle
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <LawCardGrid laws={laws} />
      )}
    </div>
  );
}
