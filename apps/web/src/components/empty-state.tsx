/** Dostça boş durum — eski görsel dilde (ikonlu head3 + kart). */
export function EmptyState({
  icon = "icon-information",
  title,
  message,
}: {
  icon?: string;
  title: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="card-content text-center">
        <h2 className="head3 mb-3">
          <i className={icon} aria-hidden />
          {title}
        </h2>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
