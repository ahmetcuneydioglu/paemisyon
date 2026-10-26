import { useFocusEffect } from "expo-router";
import { Mail } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Linking, Switch, View } from "react-native";
import { AppText, Card, Chip, ListRow, Notice, SectionHeader, Skeleton } from "@/components/ui";
import { pushPermissionStatus, requestPushPermission } from "@/lib/push";
import { useTheme } from "@/theme/ThemeProvider";
import {
  CATEGORY_HINT,
  QUIET_END_PRESETS,
  QUIET_START_PRESETS,
  REMINDER_PRESETS,
  useNotificationSettings,
  useUpdateNotificationSettings,
  type NotificationCategory,
  type NotificationSettings,
} from "./queries";

/** Ayarlar ekranındaki sıra; e-posta tek kanallı `marketing` anahtar listesinde değil, e-posta satırında anlatılır. */
const GROUPS: { title: string; keys: NotificationCategory[] }[] = [
  { title: "Günlük", keys: ["daily_question", "study_reminder", "streak"] },
  { title: "Deneme ve sınav", keys: ["exam", "exam_countdown"] },
  { title: "İçerik ve ilerleme", keys: ["new_content", "achievement", "statistics", "leaderboard"] },
  { title: "Hesap", keys: ["question_report", "system"] },
];

type Perm = "granted" | "denied" | "undetermined" | null;

/**
 * Ben › Ayarlar › Bildirimler (Doc 52 §9, Figma 51:6): ana anahtar (sunucu `pushEnabled` ×
 * cihaz izni), 12 kategori gruplu (kapatılamayanlar kilitli), hatırlatma saati çipleri
 * (`reminderTime`), sessiz saat başlangıç/bitiş, e-posta tercihleri bağlantısı (web sayfası,
 * mobilde yeniden yazılmaz). Her değişiklik anında PATCH; iyimser güncelleme, hata geri alır.
 */
export function NotificationPreferences() {
  const settings = useNotificationSettings();
  if (settings.isPending) {
    return (
      <View style={{ gap: 8 }}>
        <SectionHeader title="Bildirimler" />
        <Skeleton height={220} radiusKey="card" />
      </View>
    );
  }
  if (settings.isError) {
    return (
      <View style={{ gap: 8 }}>
        <SectionHeader title="Bildirimler" />
        <Notice tone="error" title="Tercihler alınamadı">
          {settings.error.message}
        </Notice>
      </View>
    );
  }
  return <PreferencesForm s={settings.data} />;
}

function PreferencesForm({ s }: { s: NotificationSettings }) {
  const { space, colors } = useTheme();
  const update = useUpdateNotificationSettings();
  const [perm, setPerm] = useState<Perm>(null);
  // Cihaz izni sistem ayarlarından değişebilir; ekrana her dönüşte yeniden okunur.
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void pushPermissionStatus().then((p) => {
        if (live) setPerm(p);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  const pushOn = s.pushEnabled && perm === "granted";
  const togglePush = async (on: boolean) => {
    if (!on) {
      update.mutate({ pushEnabled: false });
      return;
    }
    if (perm === "denied") {
      Alert.alert("Cihaz izni kapalı", "Anlık bildirim için cihaz ayarlarından Paemisyon'a izin ver.", [{ text: "Sonra" }, { text: "Ayarları aç", onPress: () => void Linking.openSettings() }]);
      return;
    }
    if (perm !== "granted") {
      const ok = await requestPushPermission();
      setPerm(ok ? "granted" : "denied");
      if (!ok) return;
    }
    update.mutate({ pushEnabled: true });
  };
  const setCategory = (key: NotificationCategory, on: boolean) => update.mutate({ categories: { [key]: on } });

  const masterSubtitle =
    perm === "denied" ? "Cihaz izni kapalı; ayarlardan aç" : pushOn ? "Günde en fazla bir hatırlatma; sessiz saatte beklerler" : "Deneme sonucu, günün sorusu ve hatırlatmalar";

  return (
    <View style={{ gap: space.s2 }}>
      <SectionHeader title="Bildirimler" />
      <Card style={{ gap: 0 }}>
        <Row title="Anlık bildirimler" subtitle={masterSubtitle} value={pushOn} onChange={(v) => void togglePush(v)} />
      </Card>

      {GROUPS.map((g) => (
        <View key={g.title} style={{ gap: space.s2, paddingTop: space.s2 }}>
          <AppText variant="label" tone="subtle">
            {g.title.toLocaleUpperCase("tr-TR")}
          </AppText>
          <Card style={{ gap: 0, paddingVertical: 0 }}>
            {g.keys.map((k, i) => {
              const p = s.policy[k];
              return (
                <Row
                  key={k}
                  title={p?.label ?? k}
                  subtitle={CATEGORY_HINT[k]}
                  value={s.categories[k]}
                  locked={!(p?.optional ?? true)}
                  dimmed={!pushOn && (p?.channels ?? []).every((c) => c === "push")}
                  divider={i < g.keys.length - 1}
                  onChange={(v) => setCategory(k, v)}
                />
              );
            })}
          </Card>
        </View>
      ))}

      <View style={{ gap: space.s2, paddingTop: space.s2 }}>
        <AppText variant="label" tone="subtle">
          HATIRLATMA SAATİ
        </AppText>
        <Card>
          <AppText variant="bodySm" tone="soft">
            Hedef dolmadıysa bu saatte tek bir dürtme; Günün sorusu her zaman sabah 09.00.
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            {REMINDER_PRESETS.map((t) => (
              <Chip key={t} label={t} selected={s.reminderTime === t} onPress={() => update.mutate({ reminderTime: t })} />
            ))}
          </View>
        </Card>
      </View>

      <View style={{ gap: space.s2, paddingTop: space.s2 }}>
        <AppText variant="label" tone="subtle">
          SESSİZ SAATLER
        </AppText>
        <Card>
          <AppText variant="bodySm" tone="soft">
            Bu aralıkta telefon çalmaz; bekleyen bildirim sabah tek seferde gelir.
          </AppText>
          <AppText variant="subhead">Başlangıç</AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            {QUIET_START_PRESETS.map((t) => (
              <Chip key={t} label={t} selected={s.quietStart === t} onPress={() => update.mutate({ quietStart: t })} />
            ))}
          </View>
          <AppText variant="subhead">Bitiş</AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            {QUIET_END_PRESETS.map((t) => (
              <Chip key={t} label={t} selected={s.quietEnd === t} onPress={() => update.mutate({ quietEnd: t })} />
            ))}
          </View>
        </Card>
      </View>

      <View style={{ gap: space.s2, paddingTop: space.s2 }}>
        <AppText variant="label" tone="subtle">
          E-POSTA
        </AppText>
        <Card style={{ paddingVertical: 0 }}>
          <ListRow
            title="E-posta tercihleri"
            subtitle={
              s.email
                ? s.email.subscribed
                  ? `Duyurular ${s.email.topics.duyuru ? "açık" : "kapalı"} · Kampanyalar ${s.email.topics.kampanya ? "açık" : "kapalı"}`
                  : "Abonelik kapalı; bağlantıdan yeniden açabilirsin"
                : "Bu hesapta e-posta aboneliği yok"
            }
            leading={<Mail color={colors.accent} size={20} strokeWidth={1.75} />}
            divider={false}
            onPress={s.email ? () => void Linking.openURL(s.email!.preferencesUrl) : undefined}
          />
        </Card>
      </View>

      {update.isError ? (
        <Notice tone="error" title="Kaydedilemedi">
          {update.error.message}
        </Notice>
      ) : null}
    </View>
  );
}

/** Anahtarlı satır: kilitli (kapatılamaz) satır anahtarı devre dışı ama açık gösterir; `dimmed` push kapalıyken etkisiz kategoriyi soluklaştırır. */
function Row({
  title,
  subtitle,
  value,
  onChange,
  locked = false,
  dimmed = false,
  divider = false,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  dimmed?: boolean;
  divider?: boolean;
}) {
  const { colors, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.s3,
        minHeight: 56,
        paddingVertical: space.s3,
        borderBottomWidth: divider ? 0.5 : 0,
        borderBottomColor: colors.line,
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead">{title}</AppText>
        <AppText variant="bodySm" tone="soft">
          {subtitle}
        </AppText>
      </View>
      <Switch accessibilityLabel={title} value={value} disabled={locked} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
  );
}
