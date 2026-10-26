import { Check } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, Notice } from "@/components/ui";
import { sessionToolsApi } from "@/features/quiz/api";
import { useTheme } from "@/theme/ThemeProvider";

/** Neden kodları (gys-mobil `REPORT_REASONS` ile aynı sözleşme); mesaj "Neden — açıklama" olarak gider. */
export const REPORT_REASONS = [
  { code: "wrong_answer", label: "Doğru cevap hatalı" },
  { code: "outdated_law", label: "Mevzuat güncel değil" },
  { code: "ambiguous", label: "Soru belirsiz / birden fazla doğru" },
  { code: "typo", label: "Yazım hatası" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["code"];

/** Kullanıcıya görünen kısa soru kodu: kimliğin ilk 8 hanesi (admin aramasında önek olarak işe yarar). */
export function questionCode(questionId: string): string {
  return questionId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/**
 * Soruyu bildir (gys-mobil ReportSheet kalıbı): tam sayfa modal, "Sorun ne?" neden listesi,
 * isteğe bağlı açıklama, Gönder. Klavye açılınca içerik kayar (KeyboardAvoidingView + ScrollView).
 * Aynı soruya ikinci bildirim sunucudan `alreadyReported` döner; ayrı mesajla gösterilir.
 */
export function ReportSheet({ questionId, visible, onClose }: { questionId: string; visible: boolean; onClose: () => void }) {
  const { colors, radius, space, type } = useTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "already" | "error">("idle");

  const close = () => {
    onClose();
    setTimeout(() => {
      setReason(null);
      setDescription("");
      setState("idle");
    }, 300);
  };

  const submit = async () => {
    const r = REPORT_REASONS.find((x) => x.code === reason);
    if (!r) return;
    setState("busy");
    try {
      const res = await sessionToolsApi.report(questionId, description.trim() ? `${r.label} — ${description.trim()}` : r.label);
      setState(res.alreadyReported ? "already" : "done");
    } catch {
      setState("error");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === "ios" ? space.s4 : insets.top, paddingHorizontal: space.screenGutter, paddingBottom: insets.bottom + space.s6, gap: space.s3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.s2 }}>
            <AppText variant="heading" accessibilityRole="header">
              Soruyu bildir · {questionCode(questionId)}
            </AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={close} hitSlop={12} style={{ minHeight: 44, justifyContent: "center" }}>
              <AppText variant="subhead" tone="accentInk">
                Kapat
              </AppText>
            </Pressable>
          </View>

          {state === "done" ? (
            <Notice tone="success" title="Bildirim alındı">
              Editör ekibi inceleyecek. Teşekkürler.
            </Notice>
          ) : state === "already" ? (
            <Notice tone="info" title="Zaten bildirilmiş">
              Bu soru için daha önce bildirim göndermişsin; editör sırada.
            </Notice>
          ) : (
            <>
              <AppText variant="subhead">Sorun ne?</AppText>
              <View accessibilityRole="radiogroup" style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line }}>
                {REPORT_REASONS.map((item, index) => {
                  const active = item.code === reason;
                  return (
                    <Pressable
                      key={item.code}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      onPress={() => setReason(item.code)}
                      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s3, minHeight: 52, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: colors.line, opacity: pressed ? 0.7 : 1 })}
                    >
                      <AppText variant={active ? "subhead" : "body"} tone={active ? "accentInk" : "ink"} style={{ flex: 1 }}>
                        {item.label}
                      </AppText>
                      {active ? <Check color={colors.accentInk} size={20} strokeWidth={2} /> : null}
                    </Pressable>
                  );
                })}
              </View>

              <AppText variant="subhead">Açıklama (isteğe bağlı)</AppText>
              <TextInput
                value={description}
                onChangeText={(v) => setDescription(v.slice(0, 480))}
                multiline
                placeholder="Neyin yanlış olduğunu kısaca yaz."
                placeholderTextColor={colors.inkSubtle}
                accessibilityLabel="Açıklama"
                style={[type.body, { lineHeight: undefined, color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.control, padding: space.s3, minHeight: 96, textAlignVertical: "top" }]}
              />
              {state === "error" ? <Notice tone="error">Gönderilemedi; yeniden dene.</Notice> : null}
              <Button title="Gönder" onPress={() => void submit()} loading={state === "busy"} disabled={!reason} />
            </>
          )}
          {state === "done" || state === "already" ? <Button title="Kapat" variant="secondary" onPress={close} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
