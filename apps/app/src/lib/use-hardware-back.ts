import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

/**
 * Android donanım geri tuşunu (ve geri hareketini) ekranın kendi çıkış akışına bağlar.
 * Tam ekran oynatıcılar (seans, deneme, bilgi kartları) üstteki X ile onay sorar; geri tuşu
 * bu onayı atlayıp ekranı doğrudan kapatıyordu (Android turu, 16 Kas 2026). Yalnız ekran
 * odaktayken dinler; `handler` her render'da değişebilir, son hâli çağrılır. iOS'ta etkisizdir.
 */
export function useHardwareBack(handler: () => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        ref.current();
        return true;
      });
      return () => sub.remove();
    }, []),
  );
}
