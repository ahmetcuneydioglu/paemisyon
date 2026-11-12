import Link from "next/link";
import { safeNext } from "@/lib/auth";

/**
 * Doğrulama/şifre bağlantısı oturuma çevrilemedi.
 *
 * `neden=baska-cihaz`: bağlantı mobil uygulamada (ya da başka bir tarayıcıda)
 * istenmiş; PKCE eşi bu tarayıcıda yok (auth/callback). Kayıt doğrulamasında
 * hesap zaten doğrulanmıştır, kullanıcı uygulamaya dönüp giriş yapar. Şifre
 * yenilemede yeni bağlantı buradan istenir (bu tarayıcıda başlayan akış çalışır).
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const baskaCihaz = params.neden === "baska-cihaz";
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const sifre = next === "/sifre-yenile";

  if (baskaCihaz && !sifre) {
    return (
      <div className="w-full max-w-md rounded-sheet border border-success/30 bg-surface p-6">
        <span className="type-label text-success-ink">E-posta doğrulandı</span>
        <h1 className="mt-2 type-heading text-ink">Hesabın hazır</h1>
        <p className="mt-2 type-body-sm text-ink-soft">
          Kaydı Paemisyon uygulamasında başlattıysan uygulamaya dön ve e-posta
          ile şifrenle giriş yap. Web’den devam etmek istersen buradan giriş
          yapabilirsin.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-[13px] font-bold">
          <Link href="/giris" className="text-accent-ink hover:underline">
            Web’de giriş yap
          </Link>
        </div>
      </div>
    );
  }

  if (baskaCihaz && sifre) {
    return (
      <div className="w-full max-w-md rounded-sheet border border-danger/30 bg-surface p-6">
        <span className="type-label text-danger-ink">Bağlantı bu tarayıcıda açılamadı</span>
        <h1 className="mt-2 type-heading text-ink">Yeni bağlantı iste</h1>
        <p className="mt-2 type-body-sm text-ink-soft">
          Bu şifre yenileme bağlantısı başka bir cihazda (ör. uygulamada)
          istenmiş. Aşağıdan bu tarayıcı için yeni bir bağlantı iste; gelen
          e-postayı aynı tarayıcıda aç.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-[13px] font-bold">
          <Link href="/sifremi-unuttum" className="text-accent-ink hover:underline">
            Yeni bağlantı iste
          </Link>
          <Link href="/giris" className="text-accent-ink hover:underline">
            Girişe dön
          </Link>
        </div>
      </div>
    );
  }

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
