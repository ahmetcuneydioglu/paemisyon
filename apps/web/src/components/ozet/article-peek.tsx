"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { LawArticleDetail, MevzuatReading } from "@/lib/public-api";
import { articleSlug } from "@/lib/public-api";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

const ONIZLEME_KARAKTER = 1400;

/** Pencerede gösterilen asgari madde bilgisi. */
interface PeekArticle {
  body: string;
  source: string;
  verifiedAt: string | null;
  questionCount: number;
}

/** Kanunun tam okuma yanıtı sayfa başına bir kez çekilir (madde atlasında olmayan kanunlar için yedek yol). */
const okumaOnbellek = new Map<string, Promise<MevzuatReading | null>>();
function okuma(lawSlug: string): Promise<MevzuatReading | null> {
  let p = okumaOnbellek.get(lawSlug);
  if (!p) {
    p = apiClient<MevzuatReading>(`/public/mevzuat/${lawSlug}/oku`).catch(() => null);
    okumaOnbellek.set(lawSlug, p);
  }
  return p;
}

/**
 * Önce madde atlası (küçük yanıt, komşu/soru bilgisi), olmazsa Mevzuat Merkezi okuma
 * yanıtından madde (Doc 29): metin, kanun soru kataloğunda olmasa da gelir.
 */
async function maddeGetir(lawSlug: string, no: string): Promise<PeekArticle | null> {
  const atlas = await apiClient<LawArticleDetail>(`/public/laws/${lawSlug}/articles/${articleSlug(no)}`).catch(() => null);
  if (atlas?.text) {
    return { body: atlas.text.body, source: atlas.text.source, verifiedAt: atlas.text.verifiedAt, questionCount: atlas.questionCount };
  }
  const r = await okuma(lawSlug);
  const a = r?.articles.find((x) => x.no === no || x.slug === articleSlug(no));
  if (!a) return null;
  return { body: a.text, source: r!.source, verifiedAt: r!.verifiedAt, questionCount: a.questionCount };
}

/**
 * Madde rozeti (Doc 53 §6): "md 84" → dokununca resmî madde metni bir pencerede açılır,
 * "tamamını oku" madde sayfasına götürür. Kart maddenin yerine geçmez; metin kaynağıyla gelir.
 */
export function ArticlePeek({
  lawSlug,
  no,
  title,
  className,
}: {
  lawSlug: string;
  no: string;
  title: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PeekArticle | null | undefined>(undefined);

  useEffect(() => {
    if (!open || data !== undefined) return;
    let aktif = true;
    void maddeGetir(lawSlug, no).then((d) => {
      if (aktif) setData(d);
    });
    return () => {
      aktif = false;
    };
  }, [open, data, lawSlug, no]);

  const body = data?.body ?? "";
  const kisaltildi = body.length > ONIZLEME_KARAKTER;
  const href = `/kanun/${lawSlug}/madde/${articleSlug(no)}`;
  const baslik = title?.replace(/^\d+\.\s*|^[A-Z]\.\s*/, "") ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={baslik ?? `Madde ${no}`}
        className={cn(
          "tk-interactive inline-flex h-7 items-center rounded-pill border border-line bg-surface-alt px-2 type-label text-ink-soft hover:border-accent/50 hover:text-accent-ink",
          className,
        )}
      >
        md {no}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Madde ${no}${baslik ? ` — ${baslik}` : ""}`}
        size="md"
        footer={
          <Link
            href={href}
            className="inline-flex items-center gap-1 type-subhead text-accent-ink hover:underline"
          >
            Madde sayfası <ExternalLink size={14} aria-hidden />
          </Link>
        }
      >
        {data === undefined ? (
          <p className="type-body-sm text-ink-subtle">Yükleniyor…</p>
        ) : data === null ? (
          <p className="type-body-sm text-ink-subtle">
            Madde metni şu an gösterilemiyor. <Link href={href} className="underline">Madde sayfasına git</Link>.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="whitespace-pre-line type-body text-ink">
              {kisaltildi ? `${body.slice(0, ONIZLEME_KARAKTER).replace(/\s+\S*$/, "")}…` : body}
            </p>
            <p className="type-label text-ink-subtle">
              {data.source}
              {data.verifiedAt
                ? ` · ${new Date(data.verifiedAt).toLocaleDateString("tr-TR", { dateStyle: "medium" })} itibarıyla`
                : ""}
              {data.questionCount > 0 ? ` · ${data.questionCount} çıkmış soru` : ""}
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
