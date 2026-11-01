import { ButtonLink } from "@/components/ui/button";

/**
 * "Kaldığın yer" şeridi (Doc 49/17; Expo `ResumeStrip`): sol altın çizgi, kapsam + ilerleme,
 * tek "Devam et". Yalnız sunucu taze bir yarım tur döndürdüğünde çizilir.
 */
export function ResumeStrip({
  href,
  scopeName,
  detail,
}: {
  href: string;
  scopeName: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-panel border border-l-[3px] border-line border-l-accent bg-surface py-3 pr-3 pl-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-label text-ink-subtle">Kaldığın yer</span>
        <span className="type-subhead truncate text-ink">{scopeName}</span>
        <span className="type-body-sm tabular truncate text-ink-soft">
          {detail}
        </span>
      </div>
      <ButtonLink
        href={href}
        aria-label={`${scopeName} turuna devam et, ${detail}`}
      >
        Devam et
      </ButtonLink>
    </div>
  );
}
