import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Inbox, Search, Star } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { CountdownHeader, CourseTile, FeedbackPanel, LegislationRow, QuestionMetaRow, QuestionOption, QuestionStem, ResultPanel, SessionProgress, SessionTitleBlock, TaskHero, ToolRow, type OptionState } from "@/components/domain";
import {
  ActionBar,
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  ListRow,
  Notice,
  ProgressBar,
  Screen,
  SegmentBar,
  Sheet,
  Skeleton,
  StatTile,
  TextField,
  WeekDots,
} from "@/components/ui";
import { useTheme, type ThemePreference } from "@/theme/ThemeProvider";
import { type TypeRole } from "@/theme/tokens";

/**
 * Bileşen galerisi (Doc 49 F2): storybook yerine uygulama içi. Her bileşen gerçek token'larla,
 * her varyantıyla; açık/koyu geçişi üstte. Göz testi protokolü (00-plan §4) bu ekranda koşar.
 * Yalnız geliştirme derlemesinde Ben › Geliştirici'den açılır.
 */
const seansAraclari = [
  { key: "favorite" as const, label: "Favori", active: true, onPress: () => {} },
  { key: "note" as const, label: "Not", onPress: () => {} },
  { key: "coach" as const, label: "Koça sor", onPress: () => {} },
  { key: "report" as const, label: "Hata bildir", onPress: () => {} },
];

export default function GaleriScreen() {
  const router = useRouter();
  const { colors, space, preference, setPreference } = useTheme();
  const [chip, setChip] = useState<"coach" | "course" | "wrongs">("coach");
  const [sheet, setSheet] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const roles: TypeRole[] = ["display", "title", "heading", "subhead", "body", "bodySm", "label", "stat"];
  const prefs: { value: ThemePreference; label: string }[] = [
    { value: "system", label: "Sistem" },
    { value: "dark", label: "Koyu" },
    { value: "light", label: "Açık" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen inset="none" style={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
          <IconButton icon={ArrowLeft} label="Kapat" variant="ghost" onPress={() => router.back()} />
          <AppText variant="title" style={{ flex: 1 }}>
            Galeri
          </AppText>
        </View>
        <View style={{ flexDirection: "row", gap: space.s2 }}>
          {prefs.map((p) => (
            <Chip key={p.value} label={p.label} selected={preference === p.value} onPress={() => setPreference(p.value)} />
          ))}
        </View>

        <Section title="Tipografi">
          {roles.map((r) => (
            <View key={r} style={{ gap: 2 }}>
              <AppText variant="label" tone="subtle">
                {r}
              </AppText>
              <AppText variant={r}>{r === "display" || r === "stat" ? "361" : "Koruma tedbirleri ve gözaltı"}</AppText>
            </View>
          ))}
        </Section>

        <Section title="Renk tonları">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            {(["bg", "surface", "surfaceAlt", "line", "accent", "accentSoft", "success", "successSoft", "warning", "warningSoft", "danger", "dangerSoft"] as const).map((k) => (
              <View key={k} style={{ width: 72, gap: 4 }}>
                <View style={{ height: 40, borderRadius: 10, backgroundColor: colors[k], borderWidth: 1, borderColor: colors.line }} />
                <AppText variant="label" tone="subtle" style={{ textTransform: "none", fontSize: 10 }}>
                  {k}
                </AppText>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Düğmeler">
          <Button title="Göreve başla" onPress={() => {}} />
          <Button title="Sonra" variant="secondary" onPress={() => {}} />
          <Button title="Yükleniyor" loading onPress={() => {}} />
          <Button title="Turu bitir" variant="destructive" onPress={() => {}} />
          <Button title="Vazgeç" variant="ghost" onPress={() => {}} />
          <View style={{ flexDirection: "row", gap: space.s2 }}>
            <IconButton icon={Bell} label="Bildirimler" onPress={() => {}} />
            <IconButton icon={Search} label="Ara" variant="primary" onPress={() => {}} />
            <IconButton icon={Star} label="Favori" variant="ghost" onPress={() => {}} />
          </View>
        </Section>

        <Section title="Rozet ve çip">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            <Badge>12 soru</Badge>
            <Badge tone="accent">Odak</Badge>
            <Badge tone="success">Doğru</Badge>
            <Badge tone="warning">Az veri</Badge>
            <Badge tone="danger">Zayıf</Badge>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            <Chip label="Koç seçsin" selected={chip === "coach"} onPress={() => setChip("coach")} />
            <Chip label="Ders veya konu" selected={chip === "course"} onPress={() => setChip("course")} />
            <Chip label="Yanlışlarım" selected={chip === "wrongs"} onPress={() => setChip("wrongs")} />
            <Chip label="Pasif" disabled />
          </View>
        </Section>

        <Section title="İlerleme">
          <ProgressBar value={0.72} label="Anayasa" />
          <ProgressBar value={0.48} tone="warning" label="Mevzuat" />
          <ProgressBar value={0.13} tone="danger" label="Ceza" />
          <SegmentBar total={12} done={3} />
          <WeekDots days={["done", "done", "done", "done", "today", "empty", "empty"]} />
        </Section>

        <Section title="İstatistik kutuları">
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <StatTile label="PAEM 2027" value={361} unit="gün" emphasis />
            <StatTile label="Bu hafta" value="4/5" unit="gün" progress={0.8} tone="success" />
          </View>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <StatTile label="Son deneme" value={null} hint="Henüz yeterli veri yok" />
            <StatTile label="Çözülen" value={1248} unit="soru" />
          </View>
        </Section>

        <Section title="Liste satırları">
          <Card style={{ paddingVertical: 0 }}>
            <ListRow title="Yanlışlarım" subtitle="43 soru tekrar bekliyor" trailing={<Badge tone="accent">43</Badge>} onPress={() => {}} />
            <ListRow title="Favoriler" subtitle="12 soru" onPress={() => {}} />
            <ListRow title="Bildirimler" leading={<Bell color={colors.ink} size={20} strokeWidth={1.75} />} trailing={<Badge>Açık</Badge>} divider={false} />
          </Card>
          <Card style={{ paddingVertical: 0 }}>
            <LegislationRow law="CMK" article="91" title="Gözaltı" meta="Kaldığın yer · 2 dk önce" onPress={() => {}} />
            <LegislationRow law="TCK" article="53" title="Belli hakları kullanmaktan yoksun bırakılma" meta="Doğrulandı: 24 Eyl 2026" onPress={() => {}} />
          </Card>
        </Section>

        <Section title="Bugün parçaları">
          <CountdownHeader examName="PAEM 2027" daysLeft={361} activeDays={4} todayIndex={4} />
          <CountdownHeader examName={null} daysLeft={null} activeDays={0} todayIndex={1} />
          <TaskHero kind="start" title="Koruma tedbirleri" body="Ceza Muhakemesi. Dün bu konuda 3 yanlışın vardı; bugün aynı maddeleri farklı sorularla pekiştiriyoruz." meta="12 soru · 9 dk" progress={{ done: 3, total: 12 }} />
          <TaskHero kind="comeback" title="Kısa bir dönüş turu" body="Güçlü olduğun konulardan 5 soru; ritmi yeniden bulmak için." meta="5 soru" />
          <TaskHero kind="done" title="Bugünlük tamam" body="Yarın aynı saatte görüşürüz." progress={{ done: 12, total: 12 }} />
          <Card style={{ paddingVertical: space.s2 }}>
            <CourseTile name="Anayasa Hukuku" icon="landmark" accuracy={0.72} solved={140} state="normal" onPress={() => {}} />
            <CourseTile name="Polis Meslek Mevzuatı" icon="shield" accuracy={0.48} solved={61} state="weak" onPress={() => {}} />
            <CourseTile name="Analitik Akıl Yürütme" icon="lightbulb" accuracy={null} solved={3} state="sparse" onPress={() => {}} />
          </Card>
        </Section>

        <Section title="Soru">
          <QuestionStem index={4} total={12} topic="Koruma tedbirleri" stem="Şüpheli, gözaltına alındığı andan itibaren en geç kaç saat içinde hâkim önüne çıkarılır?" />
          {(
            [
              ["A", "On iki saat", picked === "A" ? "selected" : "default"],
              ["B", "Yirmi dört saat", picked === "B" ? "selected" : "default"],
              ["C", "Kırk sekiz saat", picked === "C" ? "selected" : "default"],
              ["D", "Yetmiş iki saat", picked === "D" ? "selected" : "default"],
              ["E", "Doksan altı saat", picked === "E" ? "selected" : "default"],
            ] as [string, string, OptionState][]
          ).map(([label, text, state]) => (
            <QuestionOption key={label} label={label} text={text} state={state} onPress={() => setPicked(label)} />
          ))}
          <AppText variant="label" tone="subtle">
            Kontrol edilmiş durumlar
          </AppText>
          <QuestionOption label="B" text="Yirmi dört saat" state="correct" />
          <QuestionOption label="C" text="Kırk sekiz saat" state="incorrect" />
          <QuestionOption label="B" text="Yirmi dört saat (kaçırılan doğru)" state="missed" />
          <QuestionOption label="E" text="Doksan altı saat" state="disabled" />
        </Section>

        <Section title="Seans (Doc 49/15)">
          <SessionTitleBlock title="Anayasa Hukuku" index={3} total={10} correct={2} wrong={0} slices={["correct", "correct", "current", "future", "future", "future", "future", "future", "future", "future"]} />
          <QuestionMetaRow difficulty="hard" article={{ label: "PVSK md. 4/A", onPress: () => {} }} />
          <AppText variant="label" tone="subtle">
            Deneme dilimleri (40 soru → 20 dilim; doğruluk sızmaz)
          </AppText>
          <SessionProgress slices={Array.from({ length: 40 }, (_, i) => (i < 11 ? "answered" : i === 11 ? "current" : i === 20 ? "flagged" : "future"))} />
          <FeedbackPanel isCorrect seconds={12} explanation="Durdurma için makul bir sebep gerekir. Bu sebep, polisin tecrübesi ve içinde bulunduğu durumdan edindiği izlenime dayanır." legalReference="2559 sayılı PVSK md. 4/A" articleLabel="Maddeyi oku" onReadArticle={() => {}} tools={seansAraclari} />
          <FeedbackPanel isCorrect={false} correctLabel="C" seconds={12} explanation="Keyfî ve süreklilik arz eden durdurma yapılamaz." tools={seansAraclari} coach={{ status: "done", text: "B şıkkı 'kesin delil' aradığı için yanlış; madde makul sebeple yetinir.", remainingToday: 2 }} />
          <FeedbackPanel isCorrect tools={seansAraclari} />
          <ResultPanel correct={8} total={10} pct={80} durationLabel="4 dk 12 sn" />
          <AppText variant="label" tone="subtle">
            Araç satırı zemin üstünde
          </AppText>
          <ToolRow actions={seansAraclari} onPanel={false} />
        </Section>

        <Section title="Form, bildirim, boş durum">
          <TextField label="E-posta" placeholder="ad@ornek.com" />
          <TextField label="Şifre" value="123" error="En az 6 karakter." />
          <Notice tone="info" title="Bilgi">
            Çevrimdışısın; cevapların kuyrukta, bağlantı gelince gönderilir.
          </Notice>
          <Notice tone="success" title="Kaydedildi" />
          <Notice tone="warning" title="Günlük hak doldu">
            Yarın 04.00’te yenilenir.
          </Notice>
          <Notice tone="error" title="Bağlantı yok" />
          <Card>
            <EmptyState icon={Inbox} title="Henüz deneme yok" body="İlk deneme yayınlanınca burada görünür." action={<Button title="Denemeleri gör" variant="secondary" onPress={() => {}} />} />
          </Card>
          <View style={{ gap: space.s2 }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={76} radiusKey="card" />
          </View>
          <Button title="Sheet aç" variant="secondary" onPress={() => setSheet(true)} />
        </Section>
      </Screen>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <ActionBar title="Başlat · 10 soru · Koç seçsin" onPress={() => setSheet(true)} />
      </View>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Bugün ne çalışalım?" footer={<Button title="Başlat · 10 soru" onPress={() => setSheet(false)} />}>
        <ListRow title="Koç seçsin" subtitle="Zayıf konu ve yanlışlardan karışım" onPress={() => setChip("coach")} trailing={chip === "coach" ? <Badge tone="accent">Seçili</Badge> : null} chevron={false} />
        <ListRow title="Ders veya konu" subtitle="Kendin seç" onPress={() => setChip("course")} trailing={chip === "course" ? <Badge tone="accent">Seçili</Badge> : null} chevron={false} />
        <ListRow title="Yanlışlarım" subtitle="43 soru" onPress={() => setChip("wrongs")} trailing={chip === "wrongs" ? <Badge tone="accent">Seçili</Badge> : null} chevron={false} divider={false} />
      </Sheet>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.s3, paddingTop: space.s2 }}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}
