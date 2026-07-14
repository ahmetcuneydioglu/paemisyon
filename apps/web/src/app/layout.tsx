import type { Metadata } from "next";
import { Open_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${rubik.variable} ${openSans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
