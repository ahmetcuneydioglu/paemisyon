import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Kişisel/oturumlu alanlar indekslenmez.
        disallow: ["/profil", "/sinav", "/sonuc", "/siralama"],
      },
    ],
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
