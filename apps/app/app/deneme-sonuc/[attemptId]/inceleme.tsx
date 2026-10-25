import { useLocalSearchParams, useRouter } from "expo-router";
import { Flag, Lock } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { ReviewRow } from "@/components/domain";
import { AppText, Button, Card, Chip, Notice, Screen, Skeleton } from "@/components/ui";
import { fmtMs, useAttemptReview } from "@/features/exams/queries";
import { ApiError } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";

type Filter = "all" | "wrong" | "blank" | "flagged" | "majority";

/**
 * Cevap incelemesi listesi (Doc 50 M5-a, Figma birebir): yatay süzgeç çipleri, "çoğunluğun
 * bildiği N soruyu kaçırdın" kartı (Premium), soru kartları (durum · ders · konu · Türkiye % · süre).
 * Türkiye oranı ve "çoğunluk bildi" süzgeci kilitliyse sunucu `locked` döner; istemci kural bilmez.
 */
export default function IncelemeScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const p = useLocalSearchParams<{ attemptId: string }>();
  const review = useAttemptReview(p.attemptId ?? null, true);
  const [filter, setFilter] = useState<Filter>("all");
  const items = review.data?.items ?? [];
  const counts = { wrong: items.filter((i) => i.status === "wrong").length, blank: items.filter((i) => i.status === "blank").length, flagged: items.filter((i) => i.flagged).length };
  const rows = items.filter((i) => (filter === "all" ? true : filter === "wrong" ? i.status === "wrong" : filter === "blank" ? i.status === "blank" : filter === "flagged" ? i.flagged : i.missedMajority));
  const locked = review.data?.locked ?? true;
  const pending = review.isError && review.error instanceof ApiError && review.error.code === "RESULT_LOCKED";

  return (
    <Screen inset="none" style={{ paddingBottom: space.s8 }}>
      {review.isPending ? (
        <>
          <Skeleton height={40} radiusKey="card" />
          <Skeleton height={300} radiusKey="card" />
        </>
      ) : pending ? (
        <Notice tone="info" title="Sonuçlar bekliyor">
          Cevap incelemesi sınav penceresi kapanınca açılır.
        </Notice>
      ) : review.isError ? (
        <Notice tone="error" title="İnceleme yüklenemedi">
          {review.error.message}
        </Notice>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.screenGutter }} contentContainerStyle={{ paddingHorizontal: space.screenGutter, gap: space.s2 }}>
            <Chip label="Tümü" selected={filter === "all"} onPress={() => setFilter("all")} />
            <Chip label={`Yanlış ${counts.wrong}`} selected={filter === "wrong"} onPress={() => setFilter("wrong")} />
            <Chip label={`Boş ${counts.blank}`} selected={filter === "blank"} onPress={() => setFilter("blank")} />
            <Chip label={`İşaretli ${counts.flagged}`} icon={Flag} selected={filter === "flagged"} onPress={() => setFilter("flagged")} />
            <Chip label="Çoğunluk bildi" icon={locked ? Lock : undefined} selected={filter === "majority"} disabled={locked} onPress={() => setFilter("majority")} />
          </ScrollView>

          {!locked && review.data?.majorityMissed ? (
            <Card tone="alt" style={{ gap: 2 }}>
              <AppText variant="subhead" tone="accentInk">
                Çoğunluğun bildiği {review.data.majorityMissed} soruyu kaçırdın
              </AppText>
              <AppText variant="bodySm" tone="soft">
                Türkiye&apos;nin %70&apos;inden fazlasının doğru yaptığı sorular. Önce bunlara bak.
              </AppText>
            </Card>
          ) : null}
          {locked ? (
            <Card style={{ flexDirection: "row", gap: space.s2, alignItems: "center" }}>
              <Lock color={undefined} size={18} strokeWidth={1.75} />
              <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
                Soru bazlı Türkiye doğru oranı, ortalama süre ve &quot;çoğunluk bildi&quot; süzgeci Premium ile açılır.
              </AppText>
              <Button title="Aç" variant="ghost" onPress={() => router.push("/paywall")} />
            </Card>
          ) : null}

          <View style={{ gap: space.s2 }}>
            {rows.length === 0 ? (
              <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center", padding: space.s5 }}>
                Bu süzgeçte soru yok.
              </AppText>
            ) : null}
            {rows.map((it) => (
              <ReviewRow
                key={it.questionId}
                no={it.no}
                status={it.status}
                course={it.course}
                topic={it.topic}
                turkeyLabel={it.turkeyRate != null ? `Türkiye %${it.turkeyRate}` : null}
                timeLabel={fmtMs(it.seconds)}
                onPress={() => router.push({ pathname: "/deneme-sonuc/[attemptId]/soru/[no]", params: { attemptId: p.attemptId ?? "", no: String(it.no) } })}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
