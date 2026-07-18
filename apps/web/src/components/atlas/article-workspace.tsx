import Link from "next/link";
import type { LawArticleDetail, TopicAtlas } from "@/lib/public-api";
import { ThreePane } from "@/components/shell/three-pane";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { SourceTag } from "@/components/ui/source-tag";
import { HeatBar } from "@/components/ui/heat-bar";

/**
 * Madde detay — girişli derinlik (Doc 27 §3.5, wireframe 07): Atlas'ın kalbi.
 * Makale: madde künyesi + çıkmış soru önizlemeleri (resmî metin, kanun metni
 * içerik hattı kurulunca aynı panoya gelir — Doc 25 §4 adım 3).
 * Inspector: fetih durumu + madde reçeteli seans köprüsü (döngünün DENE kapısı).
 */
export function ArticleWorkspace({
  article,
  atlas,
}: {
  article: LawArticleDetail;
  atlas: TopicAtlas | null;
}) {
  const mine = atlas?.articles.find((a) => a.no === article.no) ?? null;
  const maxHeat = article.siblings.reduce((m, s) => Math.max(m, s.questionCount), 0);
  const atlasOf = new Map(atlas?.articles.map((a) => [a.no, a]) ?? []);

  const tree = (
    <div>
      <p className="tk-caption mb-2">{article.lawName.split(" ")[0]} maddeleri</p>
      <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto pr-1">
        {article.siblings.map((s) => {
          const st = atlasOf.get(s.no);
          const current = s.no === article.no;
          return (
            <li key={s.no}>
              <Link
                href={`/kanun/${article.lawSlug}/madde/${s.slug}`}
                aria-current={current ? "page" : undefined}
                className={[
                  "tk-interactive flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px]",
                  current ? "bg-brand/10 font-bold text-brand" : "text-ink hover:bg-line/40",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-3 shrink-0",
                    st?.conquered ? "text-success" : st && st.clearedCount > 0 ? "text-warning" : "text-ink-soft",
                  ].join(" ")}
                  aria-hidden
                >
                  {st?.conquered ? "✓" : st && st.clearedCount > 0 ? "◐" : "○"}
                </span>
                <span className="w-12 shrink-0 font-mono">m.{s.no}</span>
                <HeatBar count={s.questionCount} max={maxHeat} className="flex-1" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const body = (
    <div className="space-y-4">
      <nav className="tk-caption" aria-label="breadcrumb">
        <Link href="/kutuphane" className="hover:text-ink">Kütüphane</Link> ›{" "}
        <Link href="/kanunlar" className="hover:text-ink">Mevzuat</Link> ›{" "}
        <Link href={`/kanun/${article.lawSlug}`} className="hover:text-ink">
          {article.lawName.split(" ")[0]}
        </Link>{" "}
        › m.{article.no}
      </nav>
      <h1 className="font-heading text-xl font-bold text-ink">
        {article.lawName} — Madde {article.no}
      </h1>

      <Card>
        <CardTitle>Madde künyesi</CardTitle>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">
          Bu maddeden <b className="tabular">{article.questionCount}</b> kaynaklı çıkmış soru var
          {article.sources.length > 0 && (
            <> — sınav dağılımı aşağıda. Sorular gerçek sınavlardan; AI üretimi değildir.</>
          )}
          .
        </p>
        {article.sources.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {article.sources.map((s) => (
              <li key={s.source} className="flex items-center gap-1.5">
                <SourceTag source={s.source} />
                <span className="tabular text-[12px] text-ink-soft">×{s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {article.previews.length > 0 && (
        <Card>
          <CardTitle>Bu maddeden çıkmış soru örnekleri</CardTitle>
          <ul className="mt-2 space-y-3">
            {article.previews.map((p) => (
              <li key={p} className="border-l-2 border-atlas/40 pl-3 text-[14px] leading-relaxed text-ink-soft">
                {p}
              </li>
            ))}
          </ul>
          <p className="tk-caption mt-3">
            Tam metin ve cevaplar seans içinde — çözerken açıklama + kaynakla birlikte.
          </p>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        {article.neighbors.prev ? (
          <Link
            href={`/kanun/${article.lawSlug}/madde/${article.neighbors.prev.slug}`}
            className="text-[13px] font-bold text-ink-soft hover:text-ink"
          >
            ← m.{article.neighbors.prev.no}
          </Link>
        ) : (
          <span />
        )}
        {article.neighbors.next ? (
          <Link
            href={`/kanun/${article.lawSlug}/madde/${article.neighbors.next.slug}`}
            className="text-[13px] font-bold text-ink-soft hover:text-ink"
          >
            m.{article.neighbors.next.no} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );

  const inspector = (
    <div className="space-y-3">
      <h4 className="tk-caption">m.{article.no} — benim durumum</h4>
      <Card>
        {mine ? (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {mine.conquered ? (
              <>
                <b className="text-success">✓ Fethedildi</b> — {mine.questionCount} sorunun tamamını
                en az bir kez doğru çözdün.
              </>
            ) : (
              <>
                <b className="text-ink">{mine.clearedCount}/{mine.questionCount}</b> soru temizlendi
                — {mine.questionCount - mine.clearedCount} soru kaldı.
              </>
            )}
          </p>
        ) : (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Bu maddeyi henüz hiç çalışmadın — ilk seansın haritayı başlatır.
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
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Sınav bağlamı:{" "}
          {article.exams.map((e) => `${e.examName} %${e.weightPercent}`).join(" · ") || "—"}
        </p>
      </Card>
    </div>
  );

  return <ThreePane tree={tree} article={body} inspector={inspector} />;
}
