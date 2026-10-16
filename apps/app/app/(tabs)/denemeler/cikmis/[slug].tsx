import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppText, Badge, Button, Card, Notice, ProgressBar, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { usePastExam } from "@/features/exams/queries";
import { ApiError } from "@/lib/api";
import { readLocal } from "@/lib/local-store";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Çıkmış sınav dönemi: duruma göre tek birincil eylem (devam et / sonucunu gör / sınav gibi
 * çöz) + çalışma modu (yerel kayıt). Premium dönemde sunucu 403 PREMIUM_REQUIRED döner;
 * burada dürüst cümle (paywall F5).
 */
export default function CikmisDetayScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const p = useLocalSearchParams<{ slug: string; title?: string }>();
  const q = usePastExam(p.slug ?? null);
  const d = q.data;
  const [studyDone, setStudyDone] = useState<number | null>(null);

  useEffect(() => {
    if (!p.slug) return;
    void readLocal<Record<string, string>>(`cikmis.calisma.${p.slug}`, {}).then((r) => setStudyDone(Object.keys(r).length));
  }, [p.slug]);

  const solvable = d?.tur === "resmi" && d.examId && d.sorular.length > 0;
  const premiumBlocked = q.isError && q.error instanceof ApiError && q.error.code === "PREMIUM_REQUIRED";
  const toplam = d?.dersDagilimi.reduce((s, x) => s + x.adet, 0) ?? 0;

  return (
    <>
      <Stack.Screen options={{ title: p.title ?? d?.ad ?? "Çıkmış sınav" }} />
      <Screen inset="none">
        {q.isPending ? (
          <Skeleton height={280} radiusKey="card" />
        ) : premiumBlocked ? (
          <Notice tone="warning" title="Bu dönem Premium'da">
            Çıkmış sınavın tamamı Premium üyelikte açılır. Üyelik ekranı 2.0 ile geliyor; şimdilik canlı denemeler ve kişisel deneme açık.
          </Notice>
        ) : q.isError ? (
          <Notice tone="error" title="Dönem yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d ? (
          <>
            <Card>
              <View style={{ flexDirection: "row", gap: space.s2, flexWrap: "wrap" }}>
                <Badge tone={d.tur === "resmi" ? "success" : "neutral"}>{d.tur === "resmi" ? "Resmî kitapçık" : "Konu analizi"}</Badge>
                {d.isPremium ? <Badge tone="warning">Premium</Badge> : null}
              </View>
              <AppText variant="title">{d.ad}</AppText>
              <AppText variant="bodySm" tone="soft">
                {d.kurum}
                {d.tarih ? ` · ${new Date(d.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                {d.soruSayisi ? ` · ${d.soruSayisi} soru` : ""}
              </AppText>
              {d.ozet ? (
                <AppText variant="bodySm" tone="soft">
                  {d.ozet}
                </AppText>
              ) : null}
            </Card>

            {solvable ? (
              <View style={{ gap: space.s2 }}>
                {d.devamEden ? (
                  <>
                    <Button title={`Kaldığın yerden devam et · ${d.devamEden.cevaplanan}/${d.devamEden.toplamSoru}`} onPress={() => router.push({ pathname: "/seans", params: { archiveExamId: d.examId!, mode: "exam", title: d.ad } })} />
                    {d.devamEden.kalanSaniye != null ? (
                      <AppText variant="bodySm" tone="soft">
                        {Math.max(1, Math.round(d.devamEden.kalanSaniye / 60))} dk kaldı.
                      </AppText>
                    ) : null}
                  </>
                ) : d.benimSonucum ? (
                  <>
                    <Button title={`Sonucunu gör · ${d.benimSonucum.correctCount}/${d.benimSonucum.totalQuestions} doğru`} onPress={() => router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: d.benimSonucum!.attemptId } })} />
                    <Button title="Tekrar çöz" variant="secondary" onPress={() => router.push({ pathname: "/seans", params: { archiveExamId: d.examId!, mode: "exam", title: d.ad } })} />
                  </>
                ) : (
                  <Button title="Sınav gibi çöz · süreli" onPress={() => router.push({ pathname: "/seans", params: { archiveExamId: d.examId!, mode: "exam", title: d.ad } })} />
                )}
                <Button title={studyDone && studyDone > 0 ? `Çalışmaya devam et · ${studyDone}/${d.sorular.length}` : "Çalışma modu · süresiz, anında cevap"} variant="secondary" onPress={() => router.push({ pathname: "/(tabs)/denemeler/cikmis/calis/[slug]", params: { slug: d.slug, title: d.ad } })} />
              </View>
            ) : null}

            {d.kapaliSoru > 0 ? (
              <Notice tone="info">
                {d.kapaliSoru} soru henüz bankaya işlenmedi; işlendikçe eklenir.
              </Notice>
            ) : null}
            {d.iptalSayisi > 0 ? (
              <Notice tone="info">
                {d.iptalSayisi} soru kurum tarafından iptal edildi; sayıma girmez.
              </Notice>
            ) : null}
            {d.tur === "analiz" ? (
              <Notice tone="warning" title="Kitapçık yayımlanmadı">
                Bu dönemin dağılımı aday hatırlatmalarından derlendi; soru metni yok.
              </Notice>
            ) : null}

            {d.dersDagilimi.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Ders dağılımı" />
                <Card style={{ gap: space.s3 }}>
                  {[...d.dersDagilimi]
                    .sort((a, b) => b.adet - a.adet)
                    .map((x) => (
                      <View key={x.ders} style={{ gap: 6 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <AppText variant="subhead" style={{ flex: 1 }}>
                            {x.ders}
                          </AppText>
                          <AppText variant="subhead" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                            {x.adet} soru
                          </AppText>
                        </View>
                        <ProgressBar value={toplam > 0 ? x.adet / toplam : 0} height={5} />
                      </View>
                    ))}
                </Card>
              </View>
            ) : null}
          </>
        ) : null}
      </Screen>
    </>
  );
}
