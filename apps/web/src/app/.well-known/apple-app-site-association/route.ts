import { NextResponse } from "next/server";

/**
 * Apple universal link bildirimi (F10-P, Doc 49/15 §5b). `applinks:paemisyon.com`
 * app.config'de zaten tanımlıydı ama bu dosya hiç servis edilmiyordu; paylaşılan
 * soru bağlantısı (`/s/<id>`) uygulama yüklüyse uygulamada açılsın diye eklendi.
 * Takım 3U4QPG9Q82, paket com.paemisyon.paemisyon. Uzantısız ve `application/json`
 * olmalı; Apple CDN'i günde birkaç kez çeker.
 */
const AASA = {
  applinks: {
    details: [
      {
        appIDs: ["3U4QPG9Q82.com.paemisyon.paemisyon"],
        components: [{ "/": "/s/*", comment: "Paylaşılan soru" }],
      },
    ],
  },
};

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(AASA, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
