import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Paylaşılan soru derin bağlantısı — `https://paemisyon.com/s/<id>` (universal link, F10-P).
 * Kart QR'ı ve paylaşım metni buraya düşer; soru tek soruluk alıştırma turunda açılır
 * (`question:<uuid>` push rotasıyla aynı yol). Geçersiz id Bugün'e düşer, sürpriz yok.
 */
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default function PaylasilanSoru() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id || !UUID.test(id)) return <Redirect href="/(tabs)" />;
  return <Redirect href={{ pathname: "/seans", params: { mode: "practice", questionId: id, count: "1", source: "share" } }} />;
}
