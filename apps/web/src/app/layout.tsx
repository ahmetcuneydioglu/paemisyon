import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { themeInitScript } from "@/lib/theme";
import { config } from "@/lib/config";

// v4 "Nöbet defteri" tipografisi (Doc 49/13 §1): hero/display/title/heading/stat/brand Lora,
// gövde Inter. Token ailesi globals.css'te bu değişkenlere bağlanır.
const lora = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-lora",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
export const metadata: Metadata = {
  // Göreli metadata adreslerinin (canonical, og:url, og:image) mutlak hâle
  // geleceği köken. Bu satır olmadan canonical etiketi göreli basılıyordu;
  // tarayıcı onu doğru çözse de arama motoruna mutlak adres vermek daha güvenli.
  metadataBase: new URL(config.canonicalOrigin),
  title: { default: "Paemisyon Denemeler", template: "%s | Paemisyon" },
  description:
    "Polislik sınavlarına gerçek sınav formatında online deneme: canlı denemeler, sıralama ve soru incelemesi.",
  // Google Search Console domain sahiplik doğrulaması (OAuth branding için).
  verification: { google: "NrX9PAjwHQT2TerDTUmQlMQIBySd5NZ_x3i5lQhlhCE" },
};

/**
 * Kök layout yalnız font + global stil taşır. Sayfa kabuğu route gruplarında:
 * (site) = public üst nav + footer · (app) = girişli sol sidebar kabuğu (Doc 27 L2)
 * (auth) = ortalanmış tek kolon.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${lora.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Boya öncesi tema — flash yok (gündüz/gece otomatik veya kayıtlı seçim). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
