import Link from "next/link";
import { articleSlug, type LawDetail, type TopicAtlas } from "@/lib/public-api";
import { ThreePane } from "@/components/shell/three-pane";
import { ConquestGrid } from "@/components/ui/conquest-grid";
import { HeatBar } from "@/components/ui/heat-bar";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

/** Madde satırının fetih işareti: ✓ fethedildi · ◐ kısmi · ○ hiç. */
function conquestMark(a: { conquered: boolean; clearedCount: number } | undefined) {
  if (!a) return { mark: "○", cls: "text-ink-soft" };
  if (a.conquered) return { mark: "✓", cls: "text-success" };
  if (a.clearedCount > 0) return { mark: "◐", cls: "text-warning" };
  return { mark: "○", cls: "text-ink-soft" };
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
    (a, b) => (Number.parseInt(a.no, 10) || 9999) - (Number.parseInt(b.no, 10) || 9999),
  );
  const maxHeat = law.articles.reduce((m, a) => Math.max(m, a.questionCount), 0);
  const conquered = atlas?.conqueredCount ?? 0;

  const tree = (
    <div>
      <p className="tk-caption mb-2">
        {law.name.split(" ")[0]} ·{" "}
        {law.articles.length > 0 ? `${law.articles.length} etiketli madde` : "madde ağacı"}
      </p>
      {law.articles.length === 0 && (
        <p className="rounded-sm border border-dashed border-line p-3 text-[12px] leading-relaxed text-ink-soft">
          Bu kanunun soruları madde madde etiketlenince ağaç burada açılacak; ısı ve fetih
          haritası da onunla gelecek.
        </p>
      )}
      <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto pr-1">
        {treeArticles.map((a) => {
          const st = conquestMark(atlasOf.get(a.no));
          const current = a.no === currentArticleNo;
          return (
            <li key={a.no}>
              <Link
                href={`/kanun/${law.slug}/madde/${articleSlug(a.no)}`}
                aria-current={current ? "page" : undefined}
                className={[
                  "tk-interactive flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px]",
                  current ? "bg-brand/10 font-bold text-brand" : "text-ink hover:bg-line/40",
                ].join(" ")}
              >
                <span className={["w-3 shrink-0", st.cls].join(" ")} aria-hidden>
                  {st.mark}
                </span>
                <span className="w-12 shrink-0 font-mono">m.{a.no}</span>
                <HeatBar count={a.questionCount} max={maxHeat} className="flex-1" />
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

  const top5 = [...law.articles].sort((a, b) => b.questionCount - a.questionCount).slice(0, 5);
  const top5Share =
    law.questionCount > 0
      ? Math.round((top5.reduce((s, a) => s + a.questionCount, 0) / law.questionCount) * 100)
      : 0;

  const article = (
    <div className="space-y-4">
      <nav className="tk-caption" aria-label="breadcrumb">
        <Link href="/kutuphane" className="hover:text-ink">Kütüphane</Link> ›{" "}
        <Link href="/kanunlar" className="hover:text-ink">Mevzuat</Link> › {law.name}
      </nav>
      <h1 className="font-heading text-xl font-bold text-ink">{law.name}</h1>

      {/* Kanunu oku (Doc 25 §4 okuma katmanı) — tam metin varsa, tek giriş. */}
      {law.readable && (
        <ButtonLink href={`/kanun/${law.slug}/oku`} variant="secondary" size="lg">
          📖 Kanunun güncel tam metnini oku
        </ButtonLink>
      )}

      {top5.length > 0 && (
        <Card>
          <CardTitle>
            Isı haritası: soruların %{top5Share}&apos;i şu {top5.length} maddeden
          </CardTitle>
          <ul className="mt-3 space-y-2">
            {top5.map((a) => (
              <li key={a.no}>
                <Link
                  href={`/kanun/${law.slug}/madde/${articleSlug(a.no)}`}
                  className="tk-interactive flex items-center gap-3 rounded-sm px-1 py-1 text-[13px] hover:bg-line/30"
                >
                  <span className="w-14 shrink-0 font-mono font-bold text-ink">m.{a.no}</span>
                  <HeatBar count={a.questionCount} max={top5[0].questionCount} className="flex-1" />
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
          <CardTitle>Bu kanunda {law.questionCount} kaynaklı çıkmış soru</CardTitle>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
            {law.questionCount > 0
              ? "Madde bazlı ısı ve fetih haritası, sorular madde etiketi kazandıkça burada belirecek. Şimdiden kanun genelinde çalışabilirsin."
              : "Bu mevzuatın çıkmış soruları bankaya eklendikçe burada görünecek — koçun eklendiğinde haber verir."}
          </p>
        </Card>
      )}

      {atlas && atlas.articles.length > 0 && (
        <Card>
          <CardTitle>
            Fetih haritası — {conquered}/{atlas.articles.length} madde fethedildi
          </CardTitle>
          <p className="mb-3 mt-0.5 text-[13px] text-ink-soft">
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
          <p className="tk-caption mt-3">
            <span className="text-success">✓ yeşil</span> fethedildi ·{" "}
            <span className="text-warning">◐ sarı</span> kısmi · gri hiç çalışılmadı
          </p>
        </Card>
      )}

      {law.questionCount > 0 && (
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={`/seans?topicId=${law.topicId}&count=${Math.min(15, law.questionCount)}&scope=${encodeURIComponent(law.name)}`}
            size="lg"
          >
            Bu kanundan {Math.min(15, law.questionCount)} soruluk seans
          </ButtonLink>
        </div>
      )}
    </div>
  );

  const accuracy =
    atlas && atlas.articles.length > 0
      ? Math.round(
          (atlas.articles.reduce((s, a) => s + a.clearedCount, 0) /
            Math.max(1, atlas.articles.reduce((s, a) => s + a.questionCount, 0))) * 100,
        )
      : null;

  const inspector = (
    <div className="space-y-3">
      <h4 className="tk-caption">Benim {law.name.split(" ")[0]} durumum</h4>
      <Card>
        <p className="text-[13px] text-ink-soft">Temizlenen soru</p>
        <p className="tabular font-heading text-lg font-bold text-ink">
          {atlas ? atlas.articles.reduce((s, a) => s + a.clearedCount, 0) : 0}
          <span className="text-[13px] font-normal text-ink-soft">/{law.questionCount}</span>
          {accuracy != null && <span className="ml-2 text-[13px] text-ink-soft">%{accuracy}</span>}
        </p>
      </Card>
      {atlas && atlas.articles.length > 0 && (
        <Card>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Fetih: <b className="text-ink">{conquered}/{atlas.articles.length}</b> madde —{" "}
            {atlas.articles.length - conquered > 0
              ? `"${law.name.split(" ")[0]} Fatihi" rozetine ${atlas.articles.length - conquered} madde kaldı.`
              : "kanun fethedildi 🎉"}
          </p>
        </Card>
      )}
      <Card>
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Sınav bağlamı:{" "}
          {law.exams.map((e) => `${e.examName} · ${e.sectionName} · %${e.weightPercent}`).join(" — ") ||
            "müfredat dışı"}
        </p>
      </Card>
    </div>
  );

  return <ThreePane tree={tree} article={article} inspector={inspector} />;
}
