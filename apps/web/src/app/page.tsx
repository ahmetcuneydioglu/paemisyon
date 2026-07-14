import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Paemisyon Denemeler — Online Polislik Deneme Sınavları",
  alternates: { canonical: "/" },
};

/** Ana sayfa — eski index: bir sonraki denemeye geri sayım + son denemeler (Faz 3'te dolar). */
export default function HomePage() {
  return (
    <div>
      <div className="bg-(--color-navy-dark) py-14 text-center text-white">
        <h1 className="font-heading mb-2 text-3xl font-bold">Online Deneme Sınavları</h1>
        <p className="mb-6 text-white/80">
          Gerçek sınav formatında canlı denemeler — sıralamanı gör, eksiklerini kapat.
        </p>
        <Link href="/denemeler" className="btn-old btn-old-green">
          <i className="icon-test mr-2" aria-hidden />
          Denemelere Göz At
        </Link>
      </div>
      <h2 className="head2">Sınavlar</h2>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="py-16 text-center text-sm text-neutral-500">
          Deneme listesi Faz 3&apos;te bu alana gelecek — bir sonraki denemeye geri sayım ve
          &quot;Sınavı Başlat&quot; akışıyla birlikte.
        </p>
      </div>
    </div>
  );
}
