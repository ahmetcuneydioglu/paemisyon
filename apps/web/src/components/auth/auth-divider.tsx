/** E-posta/şifre ile sosyal giriş arasındaki "veya" ayırıcısı. */
export function AuthDivider({ label = "veya" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-line" />
      <span className="type-label text-ink-soft shrink-0">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
