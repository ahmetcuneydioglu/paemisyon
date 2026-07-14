import type { GlobalRankRow, RankRow } from "@/lib/types";

const MEDAL = ["🥇", "🥈", "🥉"];

/** İlk-3 podyum + tablo — eski siralama.php / lider-tablosu.php ortak deseni. */
export function Podium({ rows }: { rows: (RankRow | GlobalRankRow)[] }) {
  const top3 = rows.slice(0, 3);
  if (top3.length === 0) return null;
  // Podyum düzeni: 2 - 1 - 3
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <div className="mx-auto flex max-w-3xl items-end justify-center gap-3 px-4 py-8">
      {order.map((r) => {
        const isFirst = r.rank === 1;
        return (
          <div
            key={r.rank}
            className={`card-content flex-1 text-center ${isFirst ? "-mt-4 py-6" : "py-4"}`}
          >
            <div className="text-3xl">{MEDAL[r.rank - 1]}</div>
            <div className="font-heading mt-2 truncate font-bold">{r.displayName}</div>
            <div className="mt-1 text-2xl font-bold text-(--color-navy)">
              {"score" in r ? r.score.toFixed(2) : r.avgScore.toFixed(2)}
            </div>
            <div className="text-[12px] text-neutral-500">
              {"correctCount" in r
                ? `${r.correctCount}D / ${r.wrongCount}Y`
                : `${r.attempts} deneme`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Deneme sıralama tablosu (NET + D/Y/B + süre). */
export function ExamRankTable({ rows }: { rows: RankRow[] }) {
  return (
    <table className="exam-table mx-auto max-w-3xl">
      <thead>
        <tr>
          <th className="w-12">#</th>
          <th>Kullanıcı</th>
          <th>Net</th>
          <th>D / Y / B</th>
          <th>Süre</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.rank} className={r.isMe ? "!bg-(--color-navy) [&>td]:!text-white" : ""}>
            <td data-label="#">{r.rank}</td>
            <td data-label="Kullanıcı" className="font-semibold">
              {r.displayName}
              {r.isMe && <span className="ml-1 text-xs">(sen)</span>}
            </td>
            <td data-label="Net">{r.score.toFixed(2)}</td>
            <td data-label="D / Y / B">
              {r.correctCount} / {r.wrongCount} / {r.blankCount}
            </td>
            <td data-label="Süre">{formatDuration(r.durationSeconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Genel liderlik tablosu (ortalama NET + deneme sayısı). */
export function GlobalRankTable({ rows }: { rows: GlobalRankRow[] }) {
  return (
    <table className="exam-table mx-auto max-w-3xl">
      <thead>
        <tr>
          <th className="w-12">#</th>
          <th>Kullanıcı</th>
          <th>Ortalama Net</th>
          <th>Deneme</th>
          <th>Toplam Doğru</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.rank} className={r.isMe ? "!bg-(--color-navy) [&>td]:!text-white" : ""}>
            <td data-label="#">{r.rank}</td>
            <td data-label="Kullanıcı" className="font-semibold">
              {r.displayName}
              {r.isMe && <span className="ml-1 text-xs">(sen)</span>}
            </td>
            <td data-label="Ortalama Net">{r.avgScore.toFixed(2)}</td>
            <td data-label="Deneme">{r.attempts}</td>
            <td data-label="Toplam Doğru">{r.totalCorrect}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
