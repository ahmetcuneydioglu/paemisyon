import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { useRef, useState, type ComponentRef } from "react";
import { Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, Notice } from "@/components/ui";
import { SHARE_CARD_HEIGHT, SHARE_CARD_SCALE, SHARE_CARD_WIDTH, shareCardImage, type ShareCardData, type ShareMode } from "@/features/quiz/share";
import { useTheme } from "@/theme/ThemeProvider";
import { ShareQuestionCard } from "./share-card";

const W = SHARE_CARD_WIDTH / SHARE_CARD_SCALE;
const H = SHARE_CARD_HEIGHT / SHARE_CARD_SCALE;
const PREVIEW_W = 200;

/**
 * "Soruyu paylaş" sayfası (Figma "Paylaş sayfası" 49:2356/49:2447, cevapsız 49:2538/49:2619):
 * önizleme + açıklama, iki mod (yalnız cevaplanmışsa), "Paylaş…" ve "Bağlantıyı kopyala".
 * Önizleme görsel değil, yakalanan görünümün kendisidir (ölçek 200/360). Düğmeler içeriği
 * izler, alta sabitlenmez (Figma sapması 3). Radyo dairesi yok; seçili satır onay işaretiyle.
 */
export function ShareQuestionSheet({ visible, onClose, answered, build }: { visible: boolean; onClose: () => void; answered: boolean; build: (mode: ShareMode) => ShareCardData }) {
  const { colors, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [mode, setMode] = useState<ShareMode>("question");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const effective: ShareMode = answered ? mode : "question";
  const data = build(effective);
  const previewScale = PREVIEW_W / W;

  const close = () => {
    onClose();
    setTimeout(() => {
      setMode("question");
      setError(null);
      setCopied(false);
    }, 300);
  };

  const share = async () => {
    setBusy(true);
    setError(null);
    try {
      await shareCardImage(cardRef, data);
    } catch {
      setError("Kart oluşturulamadı. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(data.url);
    void Haptics.selectionAsync();
    setCopied(true);
  };

  const modes: { id: ShareMode; label: string; detail: string }[] = [
    { id: "question", label: "Soruyu paylaş", detail: "Şıklar var, cevap yok. Varsayılan." },
    { id: "answer", label: "Cevap ve açıklamayla paylaş", detail: "Doğru şık işaretli, açıklamanın ilk cümlesi ve dayanak maddesi." },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === "ios" ? space.s4 : insets.top }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.s5, marginBottom: space.s3 }}>
          <AppText variant="title">Soruyu paylaş</AppText>
          <Pressable accessibilityRole="button" onPress={close} hitSlop={12} style={{ minHeight: 44, justifyContent: "center" }}>
            <AppText variant="subhead" tone="accent">
              Kapat
            </AppText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.s5, paddingBottom: insets.bottom + space.s6, gap: space.s4 }}>
          <View style={{ flexDirection: "row", gap: space.s3, alignItems: "center" }}>
            <View style={{ width: PREVIEW_W, height: H * previewScale, borderRadius: radius.control, overflow: "hidden" }}>
              {/* Aynı görünüm hem önizlemedir hem yakalanan kaynaktır; ölçek yalnız görsel. */}
              <View style={{ width: W, height: H, transform: [{ translateX: (PREVIEW_W - W) / 2 }, { translateY: (H * previewScale - H) / 2 }, { scale: previewScale }] }}>
                <ShareQuestionCard ref={cardRef} data={data} />
              </View>
            </View>
            <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
              Kart sorunun ilk hâliyle üretilir; işaretlediğin şık karta girmez. Görselin yanında soruya giden bağlantı da gider.
            </AppText>
          </View>

          {answered ? (
            <View style={{ gap: space.s2 }}>
              {modes.map((m) => {
                const active = m.id === effective;
                return (
                  <Pressable
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setMode(m.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: space.s3,
                      padding: space.s4,
                      borderRadius: radius.card,
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? colors.accent : colors.line,
                      backgroundColor: active ? colors.accentSoft : colors.surface,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="subhead">{m.label}</AppText>
                      <AppText variant="bodySm" tone="soft">
                        {m.detail}
                      </AppText>
                    </View>
                    {active ? <Check size={22} color={colors.accentInk} strokeWidth={2} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {error ? <Notice tone="error">{error}</Notice> : null}

          <View style={{ gap: space.s2 }}>
            <Button title={busy ? "Hazırlanıyor…" : "Paylaş…"} onPress={() => void share()} loading={busy} />
            <Button title={copied ? "Bağlantı kopyalandı" : "Bağlantıyı kopyala"} variant="secondary" onPress={() => void copy()} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
