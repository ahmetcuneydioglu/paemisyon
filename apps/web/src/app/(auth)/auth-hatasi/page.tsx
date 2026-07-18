import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="w-full max-w-md rounded-lg border border-danger/30 bg-surface p-6 shadow-sm">
      <span className="tk-caption text-danger">Bağlantı geçersiz</span>
      <h1 className="mt-2 font-heading text-xl font-bold text-ink">
        Doğrulama tamamlanamadı
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        Bağlantının süresi dolmuş veya daha önce kullanılmış olabilir. Yeni bir
        doğrulama ya da şifre yenileme bağlantısı isteyebilirsin.
      </p>
      <div className="mt-5 flex flex-wrap gap-3 text-[13px] font-bold">
        <Link href="/giris" className="text-brand hover:underline">
          Girişe dön
        </Link>
        <Link href="/sifremi-unuttum" className="text-brand hover:underline">
          Şifremi yenile
        </Link>
      </div>
    </div>
  );
}
