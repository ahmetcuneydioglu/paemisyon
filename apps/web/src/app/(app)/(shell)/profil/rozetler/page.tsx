import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BadgeCatalog } from "@/lib/public-api";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Rozetler",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const badges = await api<BadgeCatalog>("/me/badges");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link
        href="/profil"
        className="text-[13px] font-bold text-brand hover:underline"
      >
        ← Profile dön
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Rozetlerin
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            Önemli kilometre taşlarının kalıcı vitrini.
          </p>
        </div>
        <span className="tabular rounded-full bg-atlas/10 px-3 py-1 text-[13px] font-bold text-atlas">
          {badges.earnedCount}/{badges.totalCount}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.items.map((badge) => (
          <Card
            key={badge.key}
            className={
              badge.earned ? "border-atlas/30 bg-atlas/5" : "opacity-65"
            }
          >
            <div className="flex items-start gap-3">
              <span
                className={[
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-lg",
                  badge.earned
                    ? "bg-atlas/15 text-atlas"
                    : "bg-line text-ink-soft",
                ].join(" ")}
                aria-hidden
              >
                {badge.earned ? "✦" : "◇"}
              </span>
              <div>
                <h2 className="font-heading text-[14px] font-bold text-ink">
                  {badge.name}
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                  {badge.description}
                </p>
                <p className="tk-caption mt-2">
                  {badge.earned ? "Kazanıldı" : "Henüz kilitli"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
