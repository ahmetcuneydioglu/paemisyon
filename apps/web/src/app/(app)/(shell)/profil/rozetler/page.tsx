import type { Metadata } from "next";
import { Lock, Medal } from "lucide-react";
import { api } from "@/lib/api";
import type { BadgeCatalog } from "@/lib/public-api";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Rozetler",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const badges = await api<BadgeCatalog>("/me/badges");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Breadcrumb
        className="mb-3"
        items={[{ label: "Ben", href: "/profil" }, { label: "Rozetler" }]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-title text-ink">Rozetlerin</h1>
          <p className="type-body-sm mt-1 text-ink-soft">
            Önemli kilometre taşlarının kalıcı vitrini.
          </p>
        </div>
        <Badge tone="accent">
          {badges.earnedCount}/{badges.totalCount}
        </Badge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.items.map((b) => (
          <Card
            key={b.key}
            tone={b.earned ? "accent" : "surface"}
            className={cn("flex items-start gap-3", !b.earned && "opacity-70")}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                b.earned
                  ? "bg-accent text-on-accent"
                  : "bg-surface-alt text-ink-subtle",
              )}
              aria-hidden
            >
              {b.earned ? <Medal size={20} /> : <Lock size={18} />}
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="type-subhead text-ink">{b.name}</h2>
              <p className="type-body-sm text-ink-soft">{b.description}</p>
              <span className="type-label text-ink-subtle">
                {b.earned ? "Kazanıldı" : "Henüz kilitli"}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
