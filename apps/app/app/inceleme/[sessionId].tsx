import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnswerReviewItem, SessionTopRow } from "@/components/domain";
import { ActionBar, AppText, Chip, Notice, Skeleton } from "@/components/ui";
import { quizApi } from "@/features/quiz/api";
import { useTheme } from "@/theme/ThemeProvider";

type Suzgec = "tumu" | "yanlis" | "dogru";

/**
 * Cevapları incele (Doc 49/18 §8, Figma 113:800): bitmiş turun soruları turdaki sırayla.
 * Süzgeç (Tümü / Yanlış / Doğru) — yanlış varsa yanlışlarla açılır, ilk yanlış açık gelir.
 * Altta tek eylem: bu turun yanlışlarını çöz. Boş bırakılanlar yalnız "Tümü"nde görünür.
 */
export default function IncelemeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ sessionId: string; title?: string }>();
  const q = useQuery({ queryKey: ["quiz", "review", p.sessionId], queryFn: () => quizApi.review(p.sessionId!), enabled: Boolean(p.sessionId) });
  const d = q.data;
  const [suzgec, setSuzgec] = useState<Suzgec | null>(null);
  const aktif: Suzgec = suzgec ?? (d && d.counts.wrong > 0 ? "yanlis" : "tumu");
  const liste = useMemo(() => (d ? d.items.filter((x) => (aktif === "tumu" ? true : aktif === "yanlis" ? x.isCorrect === false : x.isCorrect === true)) : []), [d, aktif]);
  const [acik, setAcik] = useState<Set<number> | null>(null);
  // İlk açılışta ilk satır açık gelir (Figma); kullanıcı dokununca kendi seçimi geçerli.
  const acikSet = acik ?? new Set(liste.slice(0, 1).map((x) => x.index));
  const toggle = (i: number) => {
    const n = new Set(acikSet);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    setAcik(n);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <SessionTopRow onClose={() => router.back()} closeLabel="Geri" label={p.title ? `Cevaplar · ${p.title}` : "Cevaplar"} />
      {q.isPending ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={44} radiusKey="pill" />
          <Skeleton height={220} radiusKey="card" />
          <Skeleton height={72} radiusKey="card" />
        </View>
      ) : q.isError ? (
        <View style={{ padding: space.screenGutter }}>
          <Notice tone="error" title="Cevaplar yüklenemedi">
            {q.error.message}
          </Notice>
        </View>
      ) : d ? (
        <>
          <FlatList
            data={liste}
            keyExtractor={(x) => String(x.index)}
            contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingBottom: space.s8, gap: space.s3 }}
            ListHeaderComponent={
              <View style={{ flexDirection: "row", gap: space.s2, paddingBottom: space.s1 }}>
                <Chip label={`Tümü · ${d.counts.all}`} selected={aktif === "tumu"} onPress={() => setSuzgec("tumu")} />
                <Chip label={`Yanlış · ${d.counts.wrong}`} selected={aktif === "yanlis"} disabled={d.counts.wrong === 0} onPress={() => setSuzgec("yanlis")} />
                <Chip label={`Doğru · ${d.counts.correct}`} selected={aktif === "dogru"} disabled={d.counts.correct === 0} onPress={() => setSuzgec("dogru")} />
              </View>
            }
            ListEmptyComponent={
              <AppText variant="bodySm" tone="soft">
                Bu süzgeçte soru yok.
              </AppText>
            }
            renderItem={({ item }) => <AnswerReviewItem item={item} open={acikSet.has(item.index)} onToggle={() => toggle(item.index)} />}
          />
          {d.counts.wrong > 0 ? (
            <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.bg }}>
              <ActionBar title={`Bu ${d.counts.wrong} yanlışı çöz`} onPress={() => router.replace({ pathname: "/seans", params: { mode: "review", reviewSessionId: p.sessionId! } })} />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
