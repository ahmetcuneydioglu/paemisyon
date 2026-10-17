import Link from "next/link";
import type { LawArticleDetail, TopicAtlas } from "@/lib/public-api";
import { ThreePane } from "@/components/shell/three-pane";
import { ArrowLeft, ArrowRight, Check, Circle, CircleDot } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { HeatBar } from "@/components/ui/heat-bar";
import { SourceTag } from "@/components/ui/source-tag";
import { cn } from "@/lib/cn";

/** ISO → "GG.AA.YYYY" (deterministik; locale/TZ yok → hydration güvenli). */
function formatVerifiedDate(iso: string): string {
  const d = iso.slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : iso;
}

/**
 * Madde detay — girişli derinlik (Doc 27 §3.5, wireframe 07): Atlas'ın kalbi.
 * Makale: madde künyesi + çıkmış soru önizlemeleri (resmî metin, kanun metni
 * içerik hattı kurulunca aynı panoya gelir — Doc 25 §4 adım 3).
 * Inspector: fetih durumu + madde reçeteli tur köprüsü (döngünün DENE kapısı).
 */
export function ArticleWorkspace({
  article,
  atlas,
}: {
  article: LawArticleDetail;
  atlas: TopicAtlas | null;
}) {
  const mine = atlas?.articles.find((a) => a.no === article.no) ?? null;
  const maxHeat = article.siblings.reduce(
    (m, s) => Math.max(m, s.questionCount),
    0,
  );
  const atlasOf = new Map(atlas?.articles.map((a) => [a.no, a]) ?? []);

  const tree = (
    <div>
      <p className="type-label mb-2 text-ink-subtle">
        {article.lawName.split(" ")[0]} maddeleri
      </p>
      <ul className="flex flex-col gap-0.5">
        {article.siblings.map((s) => {
          const st = atlasOf.get(s.no);
          const current = s.no === article.no;
          return (
            <li key={s.no}>
              <Link
                href={`/kanun/${article.lawSlug}/madde/${s.slug}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "tk-interactive flex min-h-9 items-center gap-2 rounded-control px-2 py-1.5 text-[13px]",
                  current
                    ? "bg-accent-soft font-semibold text-accent-ink"
                    : "text-ink hover:bg-surface-alt",
                )}
              >
                {st?.conquered ? (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="shrink-0 text-success"
                    aria-label="fethedildi"
                  />
                ) : st && st.clearedCount > 0 ? (
                  <CircleDot
                    size={14}
                    className="shrink-0 text-warning"
                    aria-label="kısmen"
                  />
                ) : (
                  <Circle
                    size={14}
                    className="shrink-0 text-ink-subtle"
                    aria-label="çalışılmadı"
                  />
                )}
                <span className="w-12 shrink-0 font-mono">m.{s.no}</span>
                <HeatBar
                  count={s.questionCount}
                  max={maxHeat}
                  className="flex-1"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const body = (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { label: "Kütüphane", href: "/kutuphane" },
          { label: "Mevzuat", href: "/kanunlar" },
          {
            label: article.lawName.split(" ")[0],
            href: `/kanun/${article.lawSlug}`,
          },
          { label: `m.${article.no}` },
        ]}
      />
      <h1 className="type-title text-ink">
        {article.lawName} — Madde {article.no}
      </h1>

      {article.text && (
        <Card>
          <CardTitle>Resmî madde metni</CardTitle>
          <div className="type-body mt-2 whitespace-pre-line text-ink">
            {article.text.body}
          </div>
          <p className="type-body-sm mt-3 text-ink-subtle">
            Kaynak:{" "}
            {article.text.sourceUrl ? (
              <a
                href={article.text.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
              >
                {article.text.source}
              </a>
            ) : (
              article.text.source
            )}
            {article.text.effectiveInfo ? (
              <> · {article.text.effectiveInfo}</>
            ) : null}
            {article.text.verifiedAt ? (
              <>
                {" "}
                · {formatVerifiedDate(article.text.verifiedAt)} itibarıyla
                doğrulandı
              </>
            ) : null}
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Madde künyesi</CardTitle>
        <p className="type-body mt-2 text-ink">
          Bu maddeden <b className="tabular">{article.questionCount}</b>{" "}
          kaynaklı çıkmış soru var
          {article.sources.length > 0 && (
            <>
              {" "}
              — sınav dağılımı aşağıda. Sorular gerçek sınavlardan; AI üretimi
              değildir.
            </>
          )}
          .
        </p>
        {article.sources.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {article.sources.map((s) => (
              <li key={s.source} className="flex items-center gap-1.5">
                <SourceTag source={s.source} />
                <span className="type-body-sm tabular text-ink-soft">
                  ×{s.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {article.previews.length > 0 && (
        <Card>
          <CardTitle>Bu maddeden çıkmış soru örnekleri</CardTitle>
          <ul className="mt-2 flex flex-col gap-3">
            {article.previews.map((p) => (
              <li
                key={p}
                className="type-body-sm border-l-2 border-accent/40 pl-3 text-ink-soft"
              >
                {p}
              </li>
            ))}
          </ul>
          <p className="type-body-sm mt-3 text-ink-subtle">
            Tam metin ve cevaplar tur içinde — çözerken açıklama + kaynakla
            birlikte.
          </p>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        {article.neighbors.prev ? (
          <Link
            href={`/kanun/${article.lawSlug}/madde/${article.neighbors.prev.slug}`}
            className="type-subhead inline-flex items-center gap-1 text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden /> m.{article.neighbors.prev.no}
          </Link>
        ) : (
          <span />
        )}
        {article.neighbors.next ? (
          <Link
            href={`/kanun/${article.lawSlug}/madde/${article.neighbors.next.slug}`}
            className="type-subhead inline-flex items-center gap-1 text-ink-soft hover:text-ink"
          >
            m.{article.neighbors.next.no} <ArrowRight size={16} aria-hidden />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );

  const inspector = (
    <div className="flex flex-col gap-3">
      <h4 className="type-label text-ink-subtle">
        m.{article.no} — benim durumum
      </h4>
      <Card>
        {mine ? (
          <p className="type-body-sm text-ink-soft">
            {mine.conquered ? (
              <>
                <b className="text-success-ink">Fethedildi</b> —{" "}
                {mine.questionCount} sorunun tamamını en az bir kez doğru
                çözdün.
              </>
            ) : (
              <>
                <b className="text-ink">
                  {mine.clearedCount}/{mine.questionCount}
                </b>{" "}
                soru temizlendi — {mine.questionCount - mine.clearedCount} soru
                kaldı.
              </>
            )}
          </p>
        ) : (
          <p className="type-body-sm text-ink-soft">
            Bu maddeyi henüz hiç çalışmadın — ilk turun haritayı başlatır.
          </p>
        )}
      </Card>
      <ButtonLink
        href={`/seans?topicId=${article.topicId}&articleNo=${encodeURIComponent(article.no)}&count=${Math.min(10, article.questionCount)}&scope=${encodeURIComponent(`${article.lawName.split(" ")[0]} m.${article.no}`)}`}
        className="w-full"
        size="lg"
      >
        Bu maddeden {Math.min(10, article.questionCount)} soru çöz
      </ButtonLink>
      <Card>
        <p className="type-body-sm text-ink-soft">
          Sınav bağlamı:{" "}
          {article.exams
            .map((e) => `${e.examName} %${e.weightPercent}`)
            .join(" · ") || "—"}
        </p>
      </Card>
    </div>
  );

  return <ThreePane tree={tree} article={body} inspector={inspector} />;
}
