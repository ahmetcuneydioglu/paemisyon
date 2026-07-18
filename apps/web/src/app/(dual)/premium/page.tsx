import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Premium — Koçun Tam Beyni",
  description:
    "Paemisyon Premium: sınırsız soru, tam tekrar hafızası, sınırsız AI açıklaması ve haftada 3 seri sigortası. Ücretsiz katman gerçek antrenman verir; Premium koçun tam beynini açar.",
  alternates: { canonical: "/premium" },
};

export const dynamic = "force-dynamic";

interface Plan {
  key: string;
  name: string;
  price: string | null;
  currency: string | null;
  period: string | null;
}

/** Doc 24 §11 tablosunun sayfalaşmış hali — dürüst karşılaştırma, karanlık desen yok. */
const ROWS: { feature: string; free: string; premium: string }[] = [
  { feature: "Günlük soru", free: "15", premium: "Sınırsız" },
  { feature: "Koç", free: "Temel kartlar (seri, hedef, deneme)", premium: "Tam koç: zayıf konu planı, madde bazlı tekrar" },
  { feature: "Yanlış tekrarı", free: "Son 7 günün yanlışları", premium: "Süresiz tekrar hafızası (spaced repetition)" },
  { feature: "AI açıklaması", free: "Günde 3", premium: "Sınırsız + madde sadeleştirme" },
  { feature: "Haftalık rapor", free: "Özet kart", premium: "Doğal dilli koç raporu + gelişim arşivi" },
  { feature: "Deneme", free: "Canlı denemelere katılım", premium: "+ Geçmiş arşivi ve sınırsız prova" },
  { feature: "Seri sigortası", free: "Haftada 1", premium: "Haftada 3 (vardiya dostu)" },
  { feature: "Rütbe ve rozetler", free: "✓ herkese", premium: "✓ herkese — satılmaz" },
];

const periodLabel: Record<string, string> = {
  monthly: "ay",
  yearly: "yıl",
  month: "ay",
  year: "yıl",
};

/**
 * Premium (Doc 27 §3.10, Doc 24 §11): "daha çok soru" değil "koçun tam beyni".
 * Web ödeme henüz yok — satın alma dürüstçe iOS uygulamasına yönlendirilir.
 */
export default async function PremiumPage() {
  const { data: auth } = await (await supabaseServer()).auth.getUser();
  const plans = auth.user
    ? await api<Plan[]>("/billing/plans").catch(() => [] as Plan[])
    : [];

  return (
    <div className={auth.user ? "" : "tk-scope font-body"}>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="text-center">
          <span className="tk-caption text-brand">Premium</span>
          <h1 className="mt-1 font-heading text-2xl font-bold text-ink">
            Koçun tam beynini aç
          </h1>
          <p className="mx-auto mt-2 max-w-[52ch] text-[15px] leading-relaxed text-ink-soft">
            Ücretsiz katman gerçek antrenman verir — Premium, seni tanıyan koçun tamamını:
            plan, süresiz tekrar hafızası, sınırsız açıklama. Bir dershanenin günlük çayı
            parasına, seni tanıyan antrenör.
          </p>
        </div>

        <Card className="mt-8 overflow-x-auto p-0">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="tk-caption border-b border-line text-left">
                <th className="px-4 py-3 font-semibold" />
                <th className="px-4 py-3 font-semibold">Ücretsiz</th>
                <th className="px-4 py-3 font-semibold text-brand">Premium</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.feature} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{r.feature}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.free}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {plans.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {plans.map((p) => (
              <Card key={p.key} className="text-center">
                <CardTitle>{p.name}</CardTitle>
                <p className="tabular mt-1 font-heading text-2xl font-bold text-ink">
                  {p.price ?? "—"} {p.currency ?? ""}
                  {p.period && (
                    <span className="text-[13px] font-normal text-ink-soft">
                      {" "}/ {periodLabel[p.period] ?? p.period}
                    </span>
                  )}
                </p>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          {auth.user ? (
            <>
              <p className="text-[14px] leading-relaxed text-ink-soft">
                Satın alma şimdilik iOS uygulamasından yapılıyor; aboneliğin bu hesapla her
                yerde geçerli olur. Web ödemesi yolda.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-sm bg-brand px-6 py-3 font-heading text-[14px] font-bold text-surface"
                >
                  iOS uygulamasında Premium&apos;a geç
                </a>
                <ButtonLink href="/bugun" variant="ghost">
                  Bugün&apos;e dön
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] text-ink-soft">
                Önce ücretsiz başla — günde 15 soru, günün sorusu ve canlı denemeler herkese açık.
              </p>
              <div className="mt-4">
                <Link
                  href="/kayit"
                  className="rounded-sm bg-brand px-6 py-3 font-heading text-[14px] font-bold text-surface"
                >
                  Ücretsiz kayıt ol
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
