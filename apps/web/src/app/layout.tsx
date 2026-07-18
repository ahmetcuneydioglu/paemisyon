import type { Metadata } from "next";
import { Open_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { themeInitScript } from "@/lib/theme";

const rubik = Rubik({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
  variable: "--font-rubik",
});
const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: { default: "Paemisyon Denemeler", template: "%s | Paemisyon" },
  description:
    "Polislik sınavlarına gerçek sınav formatında online deneme: canlı denemeler, sıralama ve soru incelemesi.",
};

/**
 * Kök layout yalnız font + global stil taşır. Sayfa kabuğu route gruplarında:
 * (site) = public üst nav + footer · (app) = girişli sol sidebar kabuğu (Doc 27 L2)
 * (auth) = ortalanmış tek kolon.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${rubik.variable} ${openSans.variable}`} suppressHydrationWarning>
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
