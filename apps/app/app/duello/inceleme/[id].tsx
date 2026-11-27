import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ChevronRight, ScrollText, X } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionOption, QuestionStem, type OptionState } from "@/components/domain";
import { AppText, Button, Card, EmptyState, IconButton, Notice, Skeleton } from "@/components/ui";
import { seconds1 } from "@/features/duel/clock";
import { useDuelReview } from "@/features/duel/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Yanlışlarım (Doc 59 · Figma 30): biten maçta yanlış ya da boş bıraktığım sorular. Açıklama ve
 * madde bağı soru bankasındaki kayıttır; düello için ayrıca içerik yazılmaz. Kaynak etiketi yok.
 */
export default function DuelloInceleme() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useDuelReview(id ?? null);
  const [i, setI] = useState(0);
  const items = q.data?.items ?? [];
  const it = items[Math.min(i, Math.max(0, items.length - 1))];
  const last = i >= items.length - 1;

  const state = (optionId: string): OptionState => (!it ? "disabled" : optionId === it.correctOptionId ? "missed" : optionId === it.myOptionId ? "incorrect" : "disabled");
  const ref = it?.relatedArticleRef ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + space.s2, paddingBottom: insets.bottom + space.s4, paddingHorizontal: space.screenGutter, gap: space.s3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
        <IconButton icon={X} label="Kapat" onPress={() => router.back()} />
        <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
          Yanlışlarım
        </AppText>
        {items.length > 0 ? (
          <AppText variant="subhead" tone="soft" maxFontSizeMultiplier={1.3} style={{ fontVariant: ["tabular-nums"] }}>
            {i + 1} / {items.length}
          </AppText>
        ) : null}
      </View>
      {q.isPending ? (
        <View style={{ gap: space.s3 }}>
          <Skeleton height={90} radiusKey="card" />
          <Skeleton height={56} radiusKey="card" />
          <Skeleton height={56} radiusKey="card" />
        </View>
      ) : q.isError ? (
        <Notice tone="error" title="İnceleme açılamadı">
          {q.error.message}
        </Notice>
      ) : !it ? (
        <EmptyState icon={ScrollText} title="Yanlışın yok" body="Bu maçta bütün soruları doğru cevapladın." action={<Button title="Geri dön" variant="secondary" onPress={() => router.back()} />} />
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space.s4, paddingVertical: space.s2 }}>
            <AppText variant="label" tone="subtle">
              Soru {it.index + 1} · {it.myOptionId ? `cevabın ${seconds1(it.myElapsedMs)}` : "boş bıraktın"}
            </AppText>
            <QuestionStem index={it.index + 1} total={q.data.questionCount} stem={it.stem} mediaUrl={it.mediaUrl} counter={false} />
            <View style={{ gap: space.s2 }}>
              {it.options.map((o) => (
                <QuestionOption key={o.id} label={o.label} text={o.text} state={state(o.id)} />
              ))}
            </View>
            {it.explanation ? (
              <Card style={{ padding: space.s4 }}>
                <AppText variant="label" tone="subtle">
                  Açıklama
                </AppText>
                <AppText variant="body">{it.explanation}</AppText>
              </Card>
            ) : null}
            {ref ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${ref.label}, maddeyi oku`}
                disabled={!ref.legislationSlug}
                onPress={() => ref.legislationSlug && router.push({ pathname: "/oku/[slug]", params: { slug: ref.legislationSlug, madde: ref.slug } })}
                style={({ pressed }) => ({ minHeight: 60, flexDirection: "row", alignItems: "center", gap: space.s3, padding: space.s4, borderRadius: radius.card, borderWidth: 1, borderColor: colors.accent, backgroundColor: pressed ? colors.surfaceAlt : colors.accentSoft })}
              >
                <ScrollText size={22} strokeWidth={1.75} color={colors.accentInk} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="subhead">{ref.label}</AppText>
                  <AppText variant="bodySm" tone="soft">
                    {ref.legislationSlug ? "İlgili madde · maddeyi oku" : "İlgili madde"}
                  </AppText>
                </View>
                {ref.legislationSlug ? <ChevronRight size={18} strokeWidth={1.75} color={colors.inkSoft} /> : null}
              </Pressable>
            ) : null}
          </ScrollView>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <Button style={{ flex: 1 }} size="sm" variant="secondary" title={i === 0 ? "Sonuca dön" : "Önceki"} onPress={() => (i === 0 ? router.back() : setI(i - 1))} />
            <Button style={{ flex: 1 }} size="sm" title={last ? "Bitir" : "Sonraki yanlış"} onPress={() => (last ? router.back() : setI(i + 1))} />
          </View>
        </>
      )}
    </View>
  );
}
