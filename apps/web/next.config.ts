import type { NextConfig } from "next";

/**
 * Güvenlik başlıkları tüm rotalara uygulanır (statik/ISR dahil). HSTS zaten
 * Vercel tarafında set edilir. CSP burada YOK — inline tema no-flash script'i
 * ve JSON-LD nonce gerektirir; ayrı bir görevde nonce'lı eklenmeli.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Mağaza kısa bağlantıları (e-posta ve sosyal medya için sorgu dizgisiz adres).
  async redirects() {
    return [
      {
        source: "/play",
        destination:
          "https://play.google.com/store/apps/details?id=com.paemisyon.paemisyon",
        permanent: false,
      },
      {
        source: "/appstore",
        destination: "https://apps.apple.com/tr/app/paemisyon/id6802087692",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
