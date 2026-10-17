import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="w-full max-w-md rounded-sheet border border-danger/30 bg-surface p-6">
      <span className="type-label text-danger-ink">Bağlantı geçersiz</span>
      <h1 className="mt-2 type-heading text-ink">
        Doğrulama tamamlanamadı
      </h1>
      <p className="mt-2 type-body-sm text-ink-soft">
        Bağlantının süresi dolmuş veya daha önce kullanılmış olabilir. Yeni bir
        doğrulama ya da şifre yenileme bağlantısı isteyebilirsin.
      </p>
      <div className="mt-5 flex flex-wrap gap-3 text-[13px] font-bold">
        <Link href="/giris" className="text-accent-ink hover:underline">
          Girişe dön
        </Link>
        <Link href="/sifremi-unuttum" className="text-accent-ink hover:underline">
          Şifremi yenile
        </Link>
      </div>
    </div>
  );
}
