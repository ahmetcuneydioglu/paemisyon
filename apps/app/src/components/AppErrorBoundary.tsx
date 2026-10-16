import { Component, type ErrorInfo, type ReactNode } from "react";
import { View } from "react-native";
import { Sentry } from "@/lib/sentry";
import { AppText, Button, Notice } from "./ui";

type State = { error: Error | null };

/** Kök hata sınırı: çizim hatasında boş ekran yerine kısa açıklama ve yeniden deneme; hata Sentry'ye. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
        <AppText variant="title">Bir şeyler ters gitti</AppText>
        <Notice tone="error" title="Ekran çizilemedi">
          Hata kaydedildi. Yeniden denemek çoğu zaman yeterlidir; sorun sürerse uygulamayı kapatıp aç.
        </Notice>
        <Button title="Yeniden dene" onPress={() => this.setState({ error: null })} />
      </View>
    );
  }
}
