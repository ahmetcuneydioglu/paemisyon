import { BookOpen, RotateCcw, Scale, Star, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { AppText, Button, ListRow, Sheet } from "@/components/ui";
import type { RoomTopic } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

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
  onDetails,
  ...sheet
}: SheetProps & {
  topic: Konu | null;
  courseName: string;
  onStart: () => void;
  onRead: () => void;
  onWrongs: () => void;
  onFavorites: () => void;
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
            <EylemSatiri icon={Star} title="Favorilerim" subtitle={t.favoriteCount > 0 ? `${t.favoriteCount} soru` : "Bu konuda favori yok"} onPress={t.favoriteCount > 0 ? onFavorites : undefined} divider={false} />
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
  onTopic,
  onLaw,
  ...sheet
}: SheetProps & {
  topics: Konu[];
  legislation: { slug: string; name: string; articleCount: number }[];
  onTopic: (t: Konu) => void;
  onLaw: (slug: string) => void;
}) {
  const { space } = useTheme();
  const ozetli = topics.filter((t) => t.units.count > 0);
  return (
    <Sheet visible={sheet.visible} onClose={sheet.onClose} onDismissed={sheet.onDismissed} title="Konu oku">
      {ozetli.length > 0 ? (
        <View style={{ gap: space.s1 }}>
          <AppText variant="label" tone="subtle">
            Ünite özetleri
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
      {ozetli.length === 0 && legislation.length === 0 ? (
        <AppText variant="bodySm" tone="soft">
          Bu derste henüz okunacak özet ya da mevzuat metni yok.
        </AppText>
      ) : null}
    </Sheet>
  );
}
