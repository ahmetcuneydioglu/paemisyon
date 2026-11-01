import { ChevronRight, Trophy } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui";
import type { LeaderboardTeaser as TeaserData } from "@/features/progress/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Bugünün tahtası (Bugün v3 §9 eki, 2 Kas 2026; web `LeaderboardTeaser`): ilk 3 satır, "Sen"
 * ilk 3'te değilse ayraç + vurgulu satır, altta sunucunun takip cümlesi (Doc 12 tonu — metin
 * istemcide üretilmez). Kartın tamamı Liderlik'e götürür; Sıradaki kartla yarışmaz (akış sonu).
 */
export function LeaderboardTeaser({
  data,
  onPress,
}: {
  data: TeaserData;
  onPress: () => void;
}) {
  const { colors, radius, space } = useTheme();
  const me = data.me;
  const meInTop = data.top.some((r) => r.isMe);
  const showMeRow = me != null && !meInTop;

  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Trophy size={12} color={colors.inkSubtle} />
        <AppText variant="label" tone="subtle" accessibilityRole="header">
          BUGÜNÜN TAHTASI
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Bugünün lider tahtası. ${data.line} Liderlik tablosunu aç.`}
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: space.s4,
          paddingVertical: space.s3,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {data.top.map((r) => (
          <Satir
            key={r.rank}
            rank={r.rank}
            name={r.isMe ? "Sen" : r.displayName}
            points={r.points}
            me={r.isMe}
          />
        ))}
        {showMeRow && me ? (
          <>
            <AppText
              variant="bodySm"
              tone="subtle"
              style={{ textAlign: "center", lineHeight: 12 }}
              accessibilityElementsHidden
            >
              ···
            </AppText>
            <Satir rank={me.rank} name="Sen" points={me.points} me />
          </>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: space.s2,
            marginTop: data.top.length > 0 ? space.s2 : 0,
            paddingTop: data.top.length > 0 ? space.s2 : 0,
            borderTopWidth: data.top.length > 0 ? 1 : 0,
            borderTopColor: colors.line,
          }}
        >
          <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
            {data.line}
          </AppText>
          <ChevronRight size={16} color={colors.inkSoft} />
        </View>
      </Pressable>
    </View>
  );
}

function Satir({
  rank,
  name,
  points,
  me,
}: {
  rank: number;
  name: string;
  points: number;
  me?: boolean;
}) {
  const { space } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.s3,
        minHeight: 36,
      }}
    >
      <AppText
        variant="subhead"
        tone="soft"
        style={{ width: 24, fontVariant: ["tabular-nums"] }}
      >
        {rank}.
      </AppText>
      <AppText
        variant="body"
        tone={me ? "accentInk" : "ink"}
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: 15,
          lineHeight: 20,
          fontWeight: me ? "600" : undefined,
        }}
      >
        {name}
      </AppText>
      <AppText
        variant="subhead"
        tone={me ? "accentInk" : "ink"}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {points} doğru
      </AppText>
    </View>
  );
}
