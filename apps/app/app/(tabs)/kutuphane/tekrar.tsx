import { useLocalSearchParams, useRouter } from "expo-router";
import { RotateCcw, Star, StarOff } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { AppText, Button, Card, Chip, EmptyState, IconButton, ListRow, Notice, Screen, Skeleton } from "@/components/ui";
import { useBookmarks, useSetBookmark, useWrongAnswers } from "@/features/review/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Tekrar (Doc 25 Bölge 2: Yanlışlarım + Favoriler). Tek kuyruk, iki sekme; tur başlatma tek
 * düğmeden. Ücretsiz planda tekrar penceresi sunucuda (7 gün) — burada kural yok.
 */
export default function TekrarScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const p = useLocalSearchParams<{ sekme?: string }>();
  const [tab, setTab] = useState<"yanlislar" | "favoriler">(p.sekme === "favoriler" ? "favoriler" : "yanlislar");
  const wrongs = useWrongAnswers();
  const bookmarks = useBookmarks();
  const setBookmark = useSetBookmark();

  const list = tab === "yanlislar" ? wrongs : bookmarks;

  return (
    <Screen inset="none">
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        <Chip label={`Yanlışlarım${wrongs.data ? ` · ${wrongs.data.length}` : ""}`} selected={tab === "yanlislar"} onPress={() => setTab("yanlislar")} />
        <Chip label={`Favoriler${bookmarks.data ? ` · ${bookmarks.data.length}` : ""}`} selected={tab === "favoriler"} onPress={() => setTab("favoriler")} />
      </View>

      {list.isPending ? (
        <Skeleton height={220} radiusKey="card" />
      ) : list.isError ? (
        <Notice tone="error" title="Liste yüklenemedi">
          {list.error.message}
        </Notice>
      ) : list.data.length === 0 ? (
        tab === "yanlislar" ? (
          <EmptyState icon={RotateCcw} title="Kuyruk temiz" body="Çözülmemiş yanlışın yok. Yeni turlarda yanlışlar buraya düşer; koç bir sonraki turda karıştırır." />
        ) : (
          <EmptyState icon={Star} title="Henüz favori yok" body="Tur içinde ⭐ ile işaretlediğin sorular burada toplanır; istediğinde hepsinden tur başlatırsın." />
        )
      ) : (
        <>
          {tab === "yanlislar" ? (
            <Button title={`Yanlış turunu başlat · ${Math.min(wrongs.data!.length, 20)} soru`} onPress={() => router.push({ pathname: "/seans", params: { mode: "review", count: String(Math.min(wrongs.data!.length, 20)), focusKind: "wrongs", courseId: "", topicId: "", recipe: "" } })} />
          ) : (
            <Button title={`Favorilerden tur · ${Math.min(bookmarks.data!.length, 20)} soru`} onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", fromBookmarks: "1", count: String(Math.min(bookmarks.data!.length, 20)), focusKind: "coach", courseId: "", topicId: "", recipe: "" } })} />
          )}
          <Card style={{ paddingVertical: 0 }}>
            {tab === "yanlislar"
              ? wrongs.data!.map((w, i) => <ListRow key={w.questionId} title={w.stem ?? "Soru"} subtitle={`${w.topicName ?? "Konu"} · ${w.wrongCount}× yanlış`} chevron={false} divider={i < wrongs.data!.length - 1} />)
              : bookmarks.data!.map((b, i) => (
                  <ListRow
                    key={b.questionId}
                    title={b.stem ?? "Soru"}
                    subtitle={b.topicName ?? null}
                    chevron={false}
                    divider={i < bookmarks.data!.length - 1}
                    trailing={<IconButton icon={StarOff} label="Favoriden çıkar" variant="ghost" onPress={() => setBookmark.mutate({ questionId: b.questionId, on: false })} />}
                  />
                ))}
          </Card>
          <AppText variant="bodySm" tone="subtle">
            {tab === "yanlislar" ? "Doğru çözdüğün soru kuyruktan düşer." : "Favoriler sana özeldir; tur sonucu puanı etkilemez."}
          </AppText>
        </>
      )}
    </Screen>
  );
}
