import Link from "next/link";
import { articleSlug, type LawDetail, type TopicAtlas } from "@/lib/public-api";
import { ThreePane } from "@/components/shell/three-pane";
import { ConquestGrid } from "@/components/ui/conquest-grid";
import { HeatBar } from "@/components/ui/heat-bar";
import { BookOpen, Check, Circle, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/** Madde satırının fetih işareti: fethedildi (onay) · kısmi (yarım) · hiç (boş). */
function ConquestMark({
  a,
}: {
  a: { conquered: boolean; clearedCount: number } | undefined;
}) {
  if (a?.conquered)
    return (
      <Check
        size={14}
        strokeWidth={2.5}
        className="shrink-0 text-success"
        aria-label="fethedildi"
      />
    );
  if (a && a.clearedCount > 0)
    return (
      <CircleDot
        size={14}
        className="shrink-0 text-warning"
        aria-label="kısmen çalışıldı"
      />
    );
  return (
    <Circle
      size={14}
      className="shrink-0 text-ink-subtle"
      aria-label="çalışılmadı"
    />
  );
}

/**
 * Kanun detay — girişli derinlik (Doc 27 §3.4, wireframe 06): L4 üç pano.
 * Ağaç: madde listesi (fetih işareti + ısı) · Makale: ısı sıralaması + fetih
 * ızgarası · Inspector: benim kanun durumum. Girişsiz vitrin ayrı bileşendedir.
 */
export function LawWorkspace({
  law,
  atlas,
  currentArticleNo,
}: {
  law: LawDetail;
  atlas: TopicAtlas | null;
  /** Madde sayfasından kullanılırsa ağaçta vurgulanacak madde. */
  currentArticleNo?: string;
}) {
  const atlasOf = new Map(atlas?.articles.map((a) => [a.no, a]) ?? []);
  // Ağaç madde no sırasında; ısı sıralaması makale panosunda ayrıca verilir.
  const treeArticles = [...law.articles].sort(
    (a, b) =>
      (Number.parseInt(a.no, 10) || 9999) - (Number.parseInt(b.no, 10) || 9999),
  );
  const maxHeat = law.articles.reduce(
    (m, a) => Math.max(m, a.questionCount),
    0,
  );
  const conquered = atlas?.conqueredCount ?? 0;

  const tree = (
    <div>
      <p className="type-label mb-2 text-ink-subtle">
        {law.name.split(" ")[0]} ·{" "}
        {law.articles.length > 0
          ? `${law.articles.length} etiketli madde`
          : "madde ağacı"}
      </p>
      {law.articles.length === 0 && (
        <p className="type-body-sm rounded-control border border-dashed border-line p-3 text-ink-soft">
          Bu kanunun soruları madde madde etiketlenince ağaç burada açılacak;
          ısı ve fetih haritası da onunla gelecek.
        </p>
      )}
      <ul className="flex flex-col gap-0.5">
        {treeArticles.map((a) => {
          const current = a.no === currentArticleNo;
          return (
            <li key={a.no}>
              <Link
                href={`/kanun/${law.slug}/madde/${articleSlug(a.no)}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "tk-interactive flex min-h-9 items-center gap-2 rounded-control px-2 py-1.5 text-[13px]",
                  current
                    ? "bg-accent-soft font-semibold text-accent-ink"
                    : "text-ink hover:bg-surface-alt",
                )}
              >
                <ConquestMark a={atlasOf.get(a.no)} />
                <span className="w-12 shrink-0 font-mono">m.{a.no}</span>
                <HeatBar
                  count={a.questionCount}
                  max={maxHeat}
                  className="flex-1"
                />
                <span className="tabular w-6 shrink-0 text-right text-[11px] text-ink-soft">
                  {a.questionCount}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const top5 = [...law.articles]
    .sort((a, b) => b.questionCount - a.questionCount)
    .slice(0, 5);
  const top5Share =
    law.questionCount > 0
      ? Math.round(
          (top5.reduce((s, a) => s + a.questionCount, 0) / law.questionCount) *
            100,
        )
      : 0;

  const article = (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { label: "Kütüphane", href: "/kutuphane" },
          { label: "Mevzuat", href: "/kanunlar" },
          { label: law.name },
        ]}
      />
      <h1 className="type-title text-ink">{law.name}</h1>

      {/* Kanunu oku (Doc 25 §4 okuma katmanı) — tam metin varsa, tek giriş. */}
      {law.readable && (
        <ButtonLink
          href={`/kanun/${law.slug}/oku`}
          variant="secondary"
          size="lg"
          className="self-start"
          leadingIcon={<BookOpen size={18} aria-hidden />}
        >
          Kanunun güncel tam metnini oku
        </ButtonLink>
      )}

      {top5.length > 0 && (
        <Card>
          <CardTitle>
            Isı haritası: soruların %{top5Share}&apos;i şu {top5.length}{" "}
            maddeden
          </CardTitle>
          <ul className="mt-3 flex flex-col gap-1">
            {top5.map((a) => (
              <li key={a.no}>
                <Link
                  href={`/kanun/${law.slug}/madde/${articleSlug(a.no)}`}
                  className="tk-interactive flex min-h-9 items-center gap-3 rounded-control px-1.5 py-1 text-[13px] hover:bg-surface-alt"
                >
                  <span className="w-14 shrink-0 font-mono font-semibold text-ink">
                    m.{a.no}
                  </span>
                  <HeatBar
                    count={a.questionCount}
                    max={top5[0].questionCount}
                    className="flex-1"
                  />
                  <span className="tabular w-14 shrink-0 text-right text-ink-soft">
                    {a.questionCount} soru
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {law.articles.length === 0 && (
        <Card>
          <CardTitle>
            Bu kanunda {law.questionCount} kaynaklı çıkmış soru
          </CardTitle>
          <p className="type-body-sm mt-1 text-ink-soft">
            {law.questionCount > 0
              ? "Madde bazlı ısı ve fetih haritası, sorular madde etiketi kazandıkça burada belirecek. Şimdiden kanun genelinde çalışabilirsin."
              : "Bu mevzuatın çıkmış soruları bankaya eklendikçe burada görünecek — koçun eklendiğinde haber verir."}
          </p>
        </Card>
      )}

      {atlas && atlas.articles.length > 0 && (
        <Card>
          <CardTitle>
            Fetih haritası — {conquered}/{atlas.articles.length} madde
            fethedildi
          </CardTitle>
          <p className="type-body-sm mt-0.5 mb-3 text-ink-soft">
            Fetih = maddenin tüm çıkmış soruları en az bir kez doğru çözüldü.
          </p>
          <ConquestGrid
            cells={atlas.articles.map((a) => ({
              no: a.no,
              href: `/kanun/${law.slug}/madde/${articleSlug(a.no)}`,
              questionCount: a.questionCount,
              clearedCount: a.clearedCount,
              conquered: a.conquered,
              current: a.no === currentArticleNo,
            }))}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="success">fethedildi</Badge>
            <Badge tone="warning">kısmi</Badge>
            <Badge>çalışılmadı</Badge>
          </div>
        </Card>
      )}

      {law.questionCount > 0 && (
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={`/seans?topicId=${law.topicId}&count=${Math.min(15, law.questionCount)}&scope=${encodeURIComponent(law.name)}`}
            size="lg"
          >
            Bu kanundan {Math.min(15, law.questionCount)} soruluk tur
          </ButtonLink>
        </div>
      )}
    </div>
  );

  const accuracy =
    atlas && atlas.articles.length > 0
      ? Math.round(
          (atlas.articles.reduce((s, a) => s + a.clearedCount, 0) /
            Math.max(
              1,
              atlas.articles.reduce((s, a) => s + a.questionCount, 0),
            )) *
            100,
        )
      : null;

  const inspector = (
    <div className="flex flex-col gap-3">
      <h4 className="type-label text-ink-subtle">
        Benim {law.name.split(" ")[0]} durumum
      </h4>
      <Card className="flex flex-col gap-1">
        <span className="type-label text-ink-subtle">Temizlenen soru</span>
        <p className="type-stat tabular text-ink">
          {atlas ? atlas.articles.reduce((s, a) => s + a.clearedCount, 0) : 0}
          <span className="type-body-sm text-ink-soft">
            /{law.questionCount}
          </span>
          {accuracy != null && (
            <span className="type-body-sm ml-2 text-ink-soft">%{accuracy}</span>
          )}
        </p>
      </Card>
      {atlas && atlas.articles.length > 0 && (
        <Card>
          <p className="type-body-sm text-ink-soft">
            Fetih:{" "}
            <b className="text-ink">
              {conquered}/{atlas.articles.length}
            </b>{" "}
            madde —{" "}
            {atlas.articles.length - conquered > 0
              ? `"${law.name.split(" ")[0]} Fatihi" rozetine ${atlas.articles.length - conquered} madde kaldı.`
              : "kanun fethedildi."}
          </p>
        </Card>
      )}
      <Card>
        <p className="type-body-sm text-ink-soft">
          Sınav bağlamı:{" "}
          {law.exams
            .map(
              (e) => `${e.examName} · ${e.sectionName} · %${e.weightPercent}`,
            )
            .join(" — ") || "müfredat dışı"}
        </p>
      </Card>
    </div>
  );

  return <ThreePane tree={tree} article={article} inspector={inspector} />;
}
