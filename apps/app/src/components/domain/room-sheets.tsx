import { BookOpen, ChevronRight, LayoutGrid, RotateCcw, Scale, Sparkles, Star, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, Button, ListRow, Sheet } from "@/components/ui";
import type { FlashcardRoomCounts, RoomTopic } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";
import { FlashcardEntry } from "./flashcards";

/** Oda sayımı → giriş satırı sayımı (durum çubuğu için öğreniliyor = kalan). */
export function roomCountsToModeCounts(f: FlashcardRoomCounts) {
  return { total: f.count, learned: f.learned, learning: Math.max(0, f.count - f.learned), new: 0, due: f.due, hard: 0, favorites: 0, locked: f.locked };
}

type SheetProps = { visible: boolean; onClose: () => void; onDismissed: () => void };
type Konu = Omit<RoomTopic, "children">;

function RowIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  const { colors } = useTheme();
  return <Icon color={active ? colors.accentInk : colors.inkSubtle} size={22} strokeWidth={1.75} />;
}

/** Sıfır sayılı eylem: dokunulmaz, sönük, alt yazı nedenini söyler. */
function EylemSatiri({ icon, title, subtitle, onPress, divider = true }: { icon: LucideIcon; title: string; subtitle: string; onPress?: () => void; divider?: boolean }) {
  return <ListRow title={title} subtitle={subtitle} leading={<RowIcon icon={icon} active={Boolean(onPress)} />} onPress={onPress} divider={divider} style={onPress ? undefined : { opacity: 0.55 }} />;
}

/**
 * Konu eylem sayfası (Çalış v2, Doc 49/17 — Figma 105:302): ders odasındaki dört eylemin
 * konuya daralmış hâli. Sayılar course-room'dan; ayrı istek yok.
 */
export function TopicActionSheet({
  topic,
  courseName,
  onStart,
  onRead,
  onWrongs,
  onFavorites,
  onFlashcards,
  onDetails,
  ...sheet
}: SheetProps & {
  topic: Konu | null;
  courseName: string;
  onStart: () => void;
  onRead: () => void;
  onWrongs: () => void;
  onFavorites: () => void;
  /** Bilgi kartları (Doc 56): sunucu sayım verdiyse satır çizilir. */
  onFlashcards?: () => void;
  /** Konu sayfası: koç notu, plan, ilgili maddeler. */
  onDetails: () => void;
}) {
  const { space } = useTheme();
  const t = topic;
  return (
    <Sheet visible={sheet.visible} onClose={sheet.onClose} onDismissed={sheet.onDismissed} title={t?.name ?? ""}>
      {t ? (
        <View style={{ gap: space.s4 }}>
          <AppText variant="bodySm" tone="soft">
            {[courseName, t.accuracyPct != null ? `%${t.accuracyPct} doğru` : null, t.solved > 0 ? `${t.solved} soru` : "henüz çözülmedi"].filter(Boolean).join(" · ")}
          </AppText>
          <Button title="Soru çöz · bu konudan 10 soru" onPress={onStart} />
          <View>
            <EylemSatiri icon={BookOpen} title="Özeti oku" subtitle={t.units.count > 0 ? `${t.units.count} ünite · ${t.units.read} okundu` : "Bu konuda henüz özet yok"} onPress={t.units.count > 0 ? onRead : undefined} />
            <EylemSatiri icon={RotateCcw} title="Yanlışlarım" subtitle={t.wrongCount > 0 ? `${t.wrongCount} soru` : "Bu konuda açık yanlış yok"} onPress={t.wrongCount > 0 ? onWrongs : undefined} />
            <EylemSatiri icon={Star} title="Favorilerim" subtitle={t.favoriteCount > 0 ? `${t.favoriteCount} soru` : "Bu konuda favori yok"} onPress={t.favoriteCount > 0 ? onFavorites : undefined} divider={Boolean(t.flashcards)} />
            {t.flashcards ? <FlashcardEntry counts={roomCountsToModeCounts(t.flashcards)} locked={t.flashcards.count === 0 && t.flashcards.locked > 0} onPress={onFlashcards} /> : null}
          </View>
          <Button title="Konu sayfasını aç" variant="ghost" size="sm" onPress={onDetails} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}
    </Sheet>
  );
}

/**
 * Ders odası "Konu oku" sayfası (Doc 49/17): ünite özeti olan konular + dersin mevzuat metinleri.
 * Özet resmî metnin yerine geçmez; ikisi ayrı satırlarda durur.
 */
export function ReadingSheet({
  topics,
  legislation,
  flashcards,
  onTopic,
  onLaw,
  onFlashcards,
  ...sheet
}: SheetProps & {
  topics: Konu[];
  legislation: { slug: string; name: string; articleCount: number }[];
  /** Dersin bilgi kartları (Doc 56 karar B: üçüncü bölüm); sunucu null verirse bölüm yok. */
  flashcards?: FlashcardRoomCounts | null;
  onTopic: (t: Konu) => void;
  onLaw: (slug: string) => void;
  onFlashcards?: () => void;
}) {
  const { space } = useTheme();
  const ozetli = topics.filter((t) => t.units.count > 0);
  const kartlar = flashcards && (flashcards.count > 0 || flashcards.locked > 0) ? flashcards : null;
  return (
    <Sheet visible={sheet.visible} onClose={sheet.onClose} onDismissed={sheet.onDismissed} title="Konu oku">
      {ozetli.length > 0 ? (
        <View style={{ gap: space.s1 }}>
          <AppText variant="label" tone="subtle">
            Ünite içerikleri
          </AppText>
          {ozetli.map((t, i) => (
            <EylemSatiri key={t.id} icon={BookOpen} title={t.name} subtitle={`${t.units.count} ünite · ${t.units.read} okundu`} onPress={() => onTopic(t)} divider={i < ozetli.length - 1} />
          ))}
        </View>
      ) : null}
      {legislation.length > 0 ? (
        <View style={{ gap: space.s1 }}>
          <AppText variant="label" tone="subtle">
            Mevzuat metni
          </AppText>
          {legislation.map((l, i) => (
            <EylemSatiri key={l.slug} icon={Scale} title={l.name} subtitle={`${l.articleCount} madde`} onPress={() => onLaw(l.slug)} divider={i < legislation.length - 1} />
          ))}
        </View>
      ) : null}
      {kartlar ? (
        <View style={{ gap: space.s1 }}>
          <AppText variant="label" tone="subtle">
            Bilgi kartları
          </AppText>
          <FlashcardEntry counts={roomCountsToModeCounts(kartlar)} locked={kartlar.count === 0 && kartlar.locked > 0} onPress={onFlashcards} />
        </View>
      ) : null}
      {ozetli.length === 0 && legislation.length === 0 && !kartlar ? (
        <AppText variant="bodySm" tone="soft">
          Bu derste henüz okunacak özet ya da mevzuat metni yok.
        </AppText>
      ) : null}
    </Sheet>
  );
}

/** Seçim sayfasının büyük seçenek satırı: ikon kutusu, başlık, açıklama, isteğe bağlı durum. */
function Secenek({ icon: Icon, title, body, meta, primary, onPress }: { icon: LucideIcon; title: string; body: string; meta?: string | null; primary?: boolean; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, body, meta].filter(Boolean).join(", ")}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.s3,
        padding: space.s4,
        borderRadius: radius.card,
        borderWidth: primary ? 1.5 : 1,
        borderColor: primary ? colors.accent : colors.line,
        backgroundColor: colors.bg,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: primary ? colors.accent : colors.surfaceAlt }}>
        <Icon color={primary ? colors.onAccent : colors.accentInk} size={22} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead" style={{ fontSize: 16, lineHeight: 22 }}>
          {title}
        </AppText>
        <AppText variant="bodySm" tone="soft">
          {body}
        </AppText>
        {meta ? (
          <AppText variant="bodySm" tone="accentInk" style={{ fontSize: 12, lineHeight: 16 }}>
            {meta}
          </AppText>
        ) : null}
      </View>
      <ChevronRight color={colors.inkSubtle} size={20} strokeWidth={1.75} />
    </Pressable>
  );
}

/**
 * "Nasıl çözmek istersin?" (Doc 49/18, Figma 111:385): ders odasının Soru çöz kutusu. Akıllı tur
 * (koç, 10 soru) varsayılan; Testler dersi baştan sona 20'şerlik sabit setlerle götürür.
 */
export function SolveChoiceSheet({
  courseName,
  tests,
  onSmart,
  onTests,
  ...sheet
}: SheetProps & {
  courseName: string;
  tests: { count: number; completed: number; inProgressNumber: number | null };
  onSmart: () => void;
  onTests: () => void;
}) {
  const { space } = useTheme();
  const durum =
    tests.count === 0
      ? null
      : [tests.completed > 0 ? `${tests.completed}/${tests.count} tamamlandı` : null, tests.inProgressNumber != null ? `Test ${tests.inProgressNumber} yarım` : null].filter(Boolean).join(" · ") || null;
  return (
    <Sheet visible={sheet.visible} onClose={sheet.onClose} onDismissed={sheet.onDismissed} title="Nasıl çözmek istersin?">
      <View style={{ gap: space.s3 }}>
        <AppText variant="bodySm" tone="soft">
          {courseName}
        </AppText>
        <Secenek icon={Sparkles} primary title="Akıllı tur" body="10 soru · koç seçer, zayıf konulara ve yanlışlara öncelik" onPress={onSmart} />
        {tests.count > 0 ? <Secenek icon={LayoutGrid} title="Testler" body={`${tests.count} test · her biri 20 soru · baştan sona`} meta={durum} onPress={onTests} /> : null}
      </View>
    </Sheet>
  );
}

/**
 * Yarım test (Doc 49/18): kaldığı yerden mi, baştan mı. Baştan başlamak yarım turu kapatır;
 * çözülen sorular emek olarak sayılır (tek aktif tur kuralı, sunucuda).
 */
export function ResumeOrRestartSheet({
  title,
  answered,
  total,
  onResume,
  onRestart,
  ...sheet
}: SheetProps & { title: string; answered: number; total: number; onResume: () => void; onRestart: () => void }) {
  const { space } = useTheme();
  return (
    <Sheet visible={sheet.visible} onClose={sheet.onClose} onDismissed={sheet.onDismissed} title={title}>
      <View style={{ gap: space.s3 }}>
        <AppText variant="bodySm" tone="soft">
          {answered}/{total} soruyu çözdün, {Math.max(0, total - answered)} soru kaldı.
        </AppText>
        <Button title={`Kaldığın yerden devam et · ${answered + 1}. soru`} onPress={onResume} />
        <Button title="Baştan başla" variant="secondary" onPress={onRestart} />
        <AppText variant="bodySm" tone="subtle" style={{ fontSize: 12, lineHeight: 16 }}>
          Baştan başlarsan yarım tur kapanır; çözdüğün {answered} soru istatistiğine sayılır.
        </AppText>
      </View>
    </Sheet>
  );
}
