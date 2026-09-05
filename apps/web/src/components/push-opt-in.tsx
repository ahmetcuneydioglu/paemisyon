"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { pushAboneOl, pushDurumu, type PushDurumu } from "@/lib/web-push";
import { Button } from "@/components/ui/button";

/**
 * "Canlı deneme başlayınca haber ver" — web push izni için YUMUŞAK ön-soru.
 *
 * Neden yumuşak: tarayıcı izin kutusu bir kez reddedilirse bir daha
 * gösterilemez (kullanıcı site ayarlarından elle açmalı). Bu yüzden önce biz
 * soruyoruz, kullanıcı "haber ver" derse tarayıcıya geçiyoruz — böylece izin
 * kutusu yalnız kabul etmeye niyetli kişiye çıkar.
 *
 * Görünmediği durumlar (hepsinde sessizdir, hata göstermez):
 *  - tarayıcı desteklemiyor (iOS Safari'de site ana ekrana eklenmeden olmaz),
 *  - Firebase web anahtarları girilmemiş,
 *  - izin zaten verilmiş ya da zaten reddedilmiş,
 *  - kullanıcı "şimdi değil" dedi (bu tarayıcıda 30 gün sorulmaz).
 */

const ERTELE_ANAHTARI = "push-ertelendi";
const ERTELEME_GUN = 30;

function ertelenmisMi(): boolean {
  try {
    const v = localStorage.getItem(ERTELE_ANAHTARI);
    return v != null && Date.now() - Number(v) < ERTELEME_GUN * 86_400_000;
  } catch {
    return false; // gizli sekme / depolama kapalı — sormaya devam
  }
}

export function PushOptIn() {
  const [durum, setDurum] = useState<PushDurumu | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sonuc, setSonuc] = useState<"ok" | "reddedildi" | "hata" | null>(null);

  // Durum yalnız istemcide bilinir (Notification API) — sunucu render'ında
  // hiçbir şey çizilmez, böylece hidrasyon uyuşmazlığı olmaz.
  useEffect(() => {
    setDurum(ertelenmisMi() ? "reddedildi" : pushDurumu());
  }, []);

  // İzin daha önce verilmişse token'ı sessizce tazele: tarayıcı token'ları
  // değişebilir; tazelenmezse kullanıcı bildirim almadığını fark bile etmez.
  useEffect(() => {
    if (durum !== "verildi") return;
    pushAboneOl((token) =>
      apiClient("/me/push-token", { method: "POST", body: { token, platform: "web" } }),
    ).catch(() => undefined);
  }, [durum]);

  if (durum !== "sorulmadi" && sonuc == null) return null;

  const acabas = async () => {
    setGonderiliyor(true);
    try {
      const token = await pushAboneOl((t) =>
        apiClient("/me/push-token", { method: "POST", body: { token: t, platform: "web" } }),
      );
      setSonuc(token ? "ok" : "reddedildi");
    } catch {
      setSonuc("hata");
    } finally {
      setGonderiliyor(false);
    }
  };

  if (sonuc === "ok") {
    return (
      <p className="mb-4 rounded-md border border-success/40 bg-success/10 px-4 py-3 text-[13px] text-ink">
        Tamam — canlı deneme başlamadan haber vereceğiz.
      </p>
    );
  }

  return (
    <section className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-md border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-ink">
          Canlı deneme başlayınca haber verelim mi?
        </p>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {sonuc === "reddedildi"
            ? "Tarayıcı izni verilmedi. Adres çubuğundaki kilit simgesinden bildirimlere izin verip tekrar deneyebilirsin."
            : sonuc === "hata"
              ? "Bildirim açılamadı. Biraz sonra tekrar dene."
              : "Sadece deneme duyuruları ve günün sorusu. İstediğin an kapatabilirsin."}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* lg (48px): dokunma hedefi >=44pt olmalı — md 40px'te kalıyordu. */}
        <Button onClick={acabas} disabled={gonderiliyor} size="lg">
          {gonderiliyor ? "Açılıyor…" : "Haber ver"}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            try {
              localStorage.setItem(ERTELE_ANAHTARI, String(Date.now()));
            } catch {
              /* depolama kapalı — yalnız bu oturumda gizle */
            }
            setDurum("reddedildi");
            setSonuc(null);
          }}
        >
          Şimdi değil
        </Button>
      </div>
    </section>
  );
}
