import * as StoreReview from "expo-store-review";
import { useIsFocused, usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import {
  reviewPromptApi,
  setPendingReviewPrompt,
  usePendingReviewPrompt,
  type ReviewPrompt,
} from "@/features/review-prompt/api";
import { ReviewPromptSheet } from "./review-prompt-sheet";

/** Odak ekranları: istem buralarda AÇILMAZ, sonuç kapanıp sekmelere dönülünce açılır (Doc 57 §2). */
const FOCUS_PREFIXES = [
  "/seans",
  "/sonuc",
  "/deneme-sonuc",
  "/deneme",
  "/inceleme",
  "/paywall",
  "/galeri",
];

/**
 * Sekme kabuğunda yaşar: bekleyen istemi, kullanıcı sekmelere döndükten kısa bir süre sonra
 * alt sayfa olarak açar. "Değerlendir" → yerel istem (iOS SKStoreReviewController / Android
 * In-App Review); yerel istem yoksa mağaza sayfası. Sonuç sunucuya bildirilir; bildirim
 * başarısız olsa da sheet kapanır (sunucuda `shown` kalır, sönüm işler).
 */
export function ReviewPromptHost() {
  const pending = usePendingReviewPrompt();
  const pathname = usePathname();
  // Sekme kabuğu odakta mı? Üstte tam ekran modal (seans/sonuç) varken false; iOS kapanmakta
  // olan modalın üstüne sunum yapmaz, o yüzden hem odak hem de kapanış payı beklenir.
  const focused = useIsFocused();
  const [shown, setShown] = useState<ReviewPrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inFocusScreen = FOCUS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!pending || shown || inFocusScreen || !focused) return;
    // Kapanış animasyonu bitsin (fullScreenModal ~0,5 sn); sheet sonucun üstüne değil, sekmenin üstüne gelsin.
    timer.current = setTimeout(() => {
      setShown(pending);
      setPendingReviewPrompt(null);
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pending, shown, inFocusScreen, focused]);

  const finish = useCallback(
    (id: string, outcome: "accepted" | "dismissed") => {
      setShown(null);
      setBusy(false);
      void reviewPromptApi.outcome(id, outcome).catch(() => undefined);
    },
    [],
  );

  const onDismiss = useCallback(() => {
    if (shown && !busy) finish(shown.id, "dismissed");
  }, [shown, busy, finish]);

  const onRate = useCallback(async () => {
    if (!shown || busy) return;
    setBusy(true);
    const id = shown.id;
    try {
      if (await StoreReview.isAvailableAsync()) {
        // iOS/Android yerel istem: sistem kotasına takılırsa sessizce görünmez; bizim için yine "accepted".
        await StoreReview.requestReview();
      } else {
        const url = StoreReview.storeUrl();
        if (url) await Linking.openURL(url);
      }
    } catch {
      // Yerel istem açılamadı; kullanıcı niyetini gösterdi — sönüm "accepted" gibi işler.
    } finally {
      finish(id, "accepted");
    }
  }, [shown, busy, finish]);

  if (Platform.OS === "web") return null;
  return (
    <ReviewPromptSheet
      prompt={shown}
      visible={Boolean(shown)}
      busy={busy}
      onRate={() => void onRate()}
      onDismiss={onDismiss}
    />
  );
}
