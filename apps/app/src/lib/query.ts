import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx yinelenmez (yetki, doğrulama); ağ ve 5xx bir kez.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
    },
  },
});

// React Native'de "pencere odağı" yok: uygulama ön plana dönünce bayat sorgular
// (brief, plan, me) kendiliğinden tazelensin — başka cihazda kurulan plan ya da
// Pazartesi revizyonu uygulamayı yeniden açınca görünsün (F8-A P-D bulgusu).
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
    return () => sub.remove();
  });
}
