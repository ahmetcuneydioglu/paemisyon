import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LeaderboardTeaser as TeaserData } from "@/lib/public-api";

/**
 * Bugünün tahtası (Bugün v3 §9 eki; Expo `LeaderboardTeaser`): ilk 3 satır, "Sen" ilk 3'te
 * değilse ayraç + vurgulu satır, altta sunucunun takip cümlesi. Kartın tamamı Liderlik
 * tablosuna bağlantıdır; Sıradaki kartla yarışmaz — akışın sonunda, bilgi tonu "surface".
 */
export function LeaderboardTeaser({
  data,
  href = "/liderlik",
}: {
  data: TeaserData;
  href?: string;
}) {
  const me = data.me;
  const meInTop = data.top.some((r) => r.isMe);
  const showMeRow = me != null && !meInTop;

  return (
    <section aria-label="Bugünün tahtası" className="flex flex-col gap-2">
      {/* Başlığa id verilmez: sayfa dar/geniş için iki kopya basar, id çakışırdı. */}
      <h2 className="type-label inline-flex items-center gap-1.5 text-ink-subtle">
        <Trophy size={12} aria-hidden /> Bugünün tahtası
      </h2>
      <Link
        href={href}
        aria-label={`Bugünün lider tahtası. ${data.line} Liderlik tablosunu aç.`}
        className="tk-interactive block rounded-card border border-line bg-surface px-4 py-3 hover:bg-surface-alt/40"
      >
        {data.top.length > 0 ? (
          <ol className="flex flex-col">
            {data.top.map((r) => (
              <Satir
                key={r.rank}
                rank={r.rank}
                name={r.isMe ? "Sen" : r.displayName}
                points={r.points}
                me={r.isMe}
              />
            ))}
            {showMeRow && me ? (
              <>
                <li
                  aria-hidden
                  className="type-body-sm py-0.5 text-center leading-none text-ink-subtle"
                >
                  ···
                </li>
                <Satir rank={me.rank} name="Sen" points={me.points} me />
              </>
            ) : null}
          </ol>
        ) : null}
        <p
          className={cn(
            "type-body-sm flex items-center justify-between gap-2 text-ink-soft",
            data.top.length > 0 && "mt-2 border-t border-line pt-2",
          )}
        >
          <span className="min-w-0">{data.line}</span>
          <ChevronRight size={16} aria-hidden className="shrink-0" />
        </p>
      </Link>
    </section>
  );
}

function Satir({
  rank,
  name,
  points,
  me,
}: {
  rank: number;
  name: string;
  points: number;
  me?: boolean;
}) {
  return (
    <li className="flex min-h-9 items-center gap-3">
      <span className="type-subhead tabular w-6 shrink-0 text-ink-soft">
        {rank}.
      </span>
      <span
        className={cn(
          "type-body min-w-0 flex-1 truncate text-[15px] leading-5",
          me ? "font-semibold text-accent-ink" : "text-ink",
        )}
      >
        {name}
      </span>
      <span
        className={cn(
          "type-subhead tabular shrink-0",
          me ? "text-accent-ink" : "text-ink",
        )}
      >
        {points} doğru
      </span>
    </li>
  );
}
