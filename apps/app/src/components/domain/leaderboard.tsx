import { Crown } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { AppText, Button, Card, ProgressBar, Sheet } from "@/components/ui";
import { fmtInt, initials, motivationLine } from "@/features/progress/leaderboard-text";
import type { Leaderboard, LeaderboardRow, RankCatalogItem } from "@/features/progress/queries";
import { useTheme } from "@/theme/ThemeProvider";
import { leagueColor, rankTier, withAlpha, xpProgress } from "@/theme/rank-tier";
import { fontFamily } from "@/theme/tokens";

/**
 * Liderlik parçaları (Doc 24 §5; Figma PaemisyonNew › "Liderlik": koyu 172:990, açık 175:992,
 * puanı yok 176:989, rütbe sistemi sayfası 183:989; Doc 49/19). Lig rengi yalnız İKİ yerde yaşar:
 * avatar halkası ve rütbe metni. Pil, hale, degrade, tablo başlığı, XP/başarı alt satırı yok.
 * Hiçbiri ekrana bağlı değil: liderlik ekranı, galeri ve ileride profil aynı parçaları kullanır.
 * Dinamik yazı: sıkışık satırlarda 1,3× tavan — telefonun büyük yazı ayarında ad ve puan taşmaz.
 */
const MAX_SCALE = 1.3;
// Sıra numarası sütunu: sabit genişlik değil alt sınır — 1,3× yazıda "12" ve üç basamaklı
// sıralar ("123", "1.234") iki satıra kırılmasın; tek satırda kalır, sütun gerektiği kadar büyür.
const RANK_NO_STYLE = { minWidth: 22, textAlign: "right", fontVariant: ["tabular-nums"] } as const;

/* ---------------------------------------------------------------- Avatar */

/** Lig halkalı dairesel avatar; görsel yoksa (ya da yüklenemezse) baş harfler. */
export function RankAvatar({ name, avatarUrl, level, size = 36 }: { name: string; avatarUrl: string | null; level: number; size?: number }) {
  const { colors, scheme } = useTheme();
  const [failed, setFailed] = useState(false);
  const font = size >= 72 ? 24 : size >= 56 ? 18 : size >= 40 ? 16 : 14;
  const showImage = Boolean(avatarUrl) && !failed;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: leagueColor(level, scheme), backgroundColor: colors.surfaceAlt, overflow: "hidden", alignItems: "center", justifyContent: "center" }}
    >
      {showImage ? (
        <Image source={{ uri: avatarUrl ?? undefined }} onError={() => setFailed(true)} style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }} />
      ) : (
        <AppText variant="heading" maxFontSizeMultiplier={1} style={{ fontSize: font, lineHeight: Math.round(font * 1.25) }}>
          {initials(name)}
        </AppText>
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- Rütbe metni */

/** Rütbe adı lig renginde — rozet değil, düz metin. `emphasis`: 15/600 (sabit kart, sheet). */
export function RankLabel({ level, rankName, emphasis = false, align = "left" }: { level: number; rankName: string; emphasis?: boolean; align?: "left" | "center" }) {
  const { scheme } = useTheme();
  return (
    <AppText
      variant="bodySm"
      numberOfLines={1}
      maxFontSizeMultiplier={MAX_SCALE}
      style={{ color: leagueColor(level, scheme), fontFamily: emphasis ? fontFamily.body[600] : fontFamily.body[500], fontSize: emphasis ? 15 : 12, lineHeight: emphasis ? 20 : 16, textAlign: align }}
    >
      {rankName}
    </AppText>
  );
}

/**
 * Dönem puanı: Lora 22 + "puan" 12 (kürsü ve sabit kart). `fit` (kürsü): dar sütunda büyük yazı
 * ayarında (ölçek > 1,15) "puan" ÜÇ sütunda birden sayının altına iner ve sayı tek satırda kalıp
 * gerekirse küçülür — yan sütunun puanına taşmaz, sütunlar aynı dizilimi korur. Normal boyda
 * Figma'daki yan yana düzen.
 */
function Points({ value, fit = false }: { value: number; fit?: boolean }) {
  const { fontScale } = useWindowDimensions();
  const stacked = fit && fontScale > 1.15;
  return (
    <View style={stacked ? { alignItems: "center", maxWidth: "100%" } : { flexDirection: "row", alignItems: "baseline", gap: 4, maxWidth: "100%" }}>
      <AppText variant="stat" maxFontSizeMultiplier={MAX_SCALE} numberOfLines={fit ? 1 : undefined} adjustsFontSizeToFit={fit} minimumFontScale={0.75} style={fit ? { flexShrink: 1 } : undefined}>
        {fmtInt(value)}
      </AppText>
      <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={MAX_SCALE} style={{ fontSize: 12, lineHeight: 16 }}>
        puan
      </AppText>
    </View>
  );
}

/* ---------------------------------------------------------------- Kürsü */

function PodiumSlot({ row, place }: { row: LeaderboardRow; place: 1 | 2 | 3 }) {
  const { colors } = useTheme();
  const first = place === 1;
  const size = first ? 72 : 56;
  return (
    <View accessible accessibilityLabel={`${place}. sıra: ${row.displayName}${row.isMe ? " (sen)" : ""}, ${row.rankName}, ${fmtInt(row.points)} puan`} style={{ flex: 1, alignItems: "center", gap: 6 }}>
      {first ? <Crown color={colors.accent} size={22} strokeWidth={2} /> : null}
      <View style={{ width: size, height: size }}>
        <RankAvatar name={row.displayName} avatarUrl={row.avatarUrl} level={row.level} size={size} />
        <View style={{ position: "absolute", right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, alignItems: "center", justifyContent: "center" }}>
          <AppText variant="label" maxFontSizeMultiplier={1} style={{ textTransform: "none", fontSize: 11, lineHeight: 14 }}>
            {place}
          </AppText>
        </View>
      </View>
      <AppText variant="subhead" tone={row.isMe ? "accentInk" : "ink"} numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={{ marginTop: 4, textAlign: "center", maxWidth: "100%" }}>
        {row.displayName}
      </AppText>
      <RankLabel level={row.level} rankName={row.rankName} align="center" />
      <Points value={row.points} fit />
    </View>
  );
}

/** İlk 3 — tek kartta 2 · 1 · 3 düzeni; 1. büyük avatar + taç. */
export function LeaderboardPodium({ rows }: { rows: LeaderboardRow[] }) {
  const { space } = useTheme();
  const [first, second, third] = rows;
  if (!first) return null;
  return (
    <Card style={{ paddingVertical: space.s5, paddingHorizontal: space.s4 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.s2 }}>
        {second ? <PodiumSlot row={second} place={2} /> : <View style={{ flex: 1 }} />}
        <PodiumSlot row={first} place={1} />
        {third ? <PodiumSlot row={third} place={3} /> : <View style={{ flex: 1 }} />}
      </View>
    </Card>
  );
}

/* ---------------------------------------------------------------- Liste */

function ListRow({ row, last }: { row: LeaderboardRow; last: boolean }) {
  const { colors, space, radius } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${row.rank}. sıra: ${row.displayName}${row.isMe ? " (sen)" : ""}, ${row.rankName}, ${fmtInt(row.points)} puan`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.s3,
        paddingVertical: space.s3,
        paddingHorizontal: row.isMe ? space.s2 : 0,
        marginHorizontal: row.isMe ? -space.s2 : 0,
        minHeight: 56,
        borderRadius: row.isMe ? radius.control : 0,
        backgroundColor: row.isMe ? colors.accentSoft : "transparent",
        borderBottomWidth: last || row.isMe ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.line,
      }}
    >
      <AppText variant="subhead" tone="soft" numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={RANK_NO_STYLE}>
        {row.rank}
      </AppText>
      <RankAvatar name={row.displayName} avatarUrl={row.avatarUrl} level={row.level} size={36} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <AppText variant="subhead" tone={row.isMe ? "accentInk" : "ink"} numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={{ flexShrink: 1 }}>
            {row.displayName}
          </AppText>
          {row.isMe ? (
            <AppText variant="label" tone="accentInk" maxFontSizeMultiplier={MAX_SCALE}>
              sen
            </AppText>
          ) : null}
        </View>
        <RankLabel level={row.level} rankName={row.rankName} />
      </View>
      <AppText variant="subhead" tone={row.isMe ? "accentInk" : "ink"} maxFontSizeMultiplier={MAX_SCALE} style={{ fontVariant: ["tabular-nums"] }}>
        {fmtInt(row.points)}
      </AppText>
    </View>
  );
}

/** Kürsü sonrası kalan sıralar (4…): başlıksız kart, ince ayraçlı satırlar; boşsa davet cümlesi. */
export function LeaderboardList({ rows }: { rows: LeaderboardRow[] }) {
  const { space } = useTheme();
  if (rows.length === 0) {
    return (
      <Card>
        <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
          Bu dönemde başka katılımcı yok. İlk sıralar seni bekliyor.
        </AppText>
      </Card>
    );
  }
  return (
    <Card style={{ paddingVertical: 0, paddingHorizontal: space.s4, gap: 0 }}>
      {rows.map((r, i) => (
        <ListRow key={`${r.rank}-${r.displayName}`} row={r} last={i === rows.length - 1} />
      ))}
    </Card>
  );
}

/* ---------------------------------------------------------------- Senin sıran */

/**
 * "Senin sıran" — ekranın altında sabit duran kişisel kart: listedeki satırla aynı dil (sıra,
 * halka, ad + SEN, rütbe · XP, puan), altında takip cümlesi ve bir üst rütbeye ilerleme. Listede
 * görünmesen de durumun hep ekranda; puanın yoksa sıra "—" ve davet cümlesi.
 */
export function LeaderboardMyRank({ me, ranks }: { me: Leaderboard["me"]; ranks?: RankCatalogItem[] | null }) {
  const { colors, radius, space, scheme } = useTheme();
  const hasRank = me.rank > 0;
  const line = motivationLine(me.rank, me.pointsToNext, me.nextName);
  const xp = xpProgress(me.xp, me.level, ranks);
  const caption = xp.nextMin == null ? "En yüksek rütbe" : `Bir üst rütbeye ${fmtInt(xp.toNext)} XP`;
  return (
    <View
      accessible
      accessibilityLabel={`Senin sıran ${hasRank ? fmtInt(me.rank) : "henüz yok"}, ${me.rankName}, ${fmtInt(me.points)} puan, ${fmtInt(me.xp)} XP. ${line} ${caption}.`}
      style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: withAlpha(colors.accent, 0.4), padding: space.s4, gap: space.s3 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
        <AppText variant="subhead" tone="soft" numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={RANK_NO_STYLE}>
          {hasRank ? fmtInt(me.rank) : "—"}
        </AppText>
        <RankAvatar name={me.displayName} avatarUrl={me.avatarUrl} level={me.level} size={40} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <AppText variant="subhead" numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={{ flexShrink: 1 }}>
              {me.displayName}
            </AppText>
            <AppText variant="label" tone="accentInk" maxFontSizeMultiplier={MAX_SCALE}>
              sen
            </AppText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <RankLabel level={me.level} rankName={me.rankName} />
            <AppText variant="bodySm" tone="soft" numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={{ fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
              · {fmtInt(me.xp)} XP
            </AppText>
          </View>
        </View>
        <Points value={me.points} />
      </View>
      <View style={{ gap: 6 }}>
        <AppText variant="bodySm" maxFontSizeMultiplier={MAX_SCALE}>
          {line}
        </AppText>
        <ProgressBar value={xp.pct / 100} color={leagueColor(me.level, scheme)} track={colors.line} height={4} label={caption} />
        <AppText variant="bodySm" tone="subtle" maxFontSizeMultiplier={MAX_SCALE} style={{ fontSize: 12, lineHeight: 16 }}>
          {caption}
        </AppText>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- Rütbe sistemi */

function CatalogRow({ item, currentLevel }: { item: RankCatalogItem; currentLevel: number | null }) {
  const { colors, scheme, space, radius } = useTheme();
  const current = currentLevel === item.level;
  const reached = currentLevel != null && item.level <= currentLevel;
  const color = leagueColor(item.level, scheme);
  return (
    <View
      accessible
      accessibilityLabel={`${item.level}. rütbe ${item.name}, ${rankTier(item.level).league} lig, ${fmtInt(item.minScore)} XP${current ? ", senin rütben" : ""}`}
      style={{ flexDirection: "row", alignItems: "center", gap: space.s3, minHeight: 44, paddingVertical: space.s2, paddingHorizontal: current ? space.s2 : 0, marginHorizontal: current ? -space.s2 : 0, borderRadius: current ? radius.control : 0, backgroundColor: current ? colors.accentSoft : "transparent" }}
    >
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: color, backgroundColor: colors.surfaceAlt }} />
      <AppText variant="subhead" tone={reached ? "ink" : "soft"} numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={{ flex: 1 }}>
        {item.name}
      </AppText>
      {current ? (
        <AppText variant="label" tone="accentInk" maxFontSizeMultiplier={MAX_SCALE}>
          sen
        </AppText>
      ) : null}
      <AppText variant="bodySm" maxFontSizeMultiplier={MAX_SCALE} style={{ color, fontFamily: fontFamily.body[500], fontSize: 13, lineHeight: 18 }}>
        {rankTier(item.level).league}
      </AppText>
      <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={MAX_SCALE} style={{ width: 72, textAlign: "right", fontSize: 13, lineHeight: 18, fontVariant: ["tabular-nums"] }}>
        {fmtInt(item.minScore)} XP
      </AppText>
    </View>
  );
}

/**
 * "Rütbe sistemi" alt sayfası (başlık çubuğundaki bilgi düğmesi): puan ile XP'nin farkı, senin
 * rütben ve ilerlemen, 8 rütbenin kataloğu (lig halkası, ad, lig, eşik). Katalog ve katsayı
 * sunucudan gelir; eski sunucuda katalog yoksa yalnız açıklama ve senin rütben gösterilir.
 */
export function RankSystemSheet({ visible, onClose, me, ranks, activeDayPoints }: { visible: boolean; onClose: () => void; me?: Leaderboard["me"] | null; ranks?: RankCatalogItem[] | null; activeDayPoints?: number | null }) {
  const { colors, radius, space, scheme } = useTheme();
  const xpRule = activeDayPoints != null ? `XP ise çözdüğün her soruyla ve her aktif günle (gün başına ${fmtInt(activeDayPoints)} XP) birikir` : "XP ise çözdüğün soru ve aktif geçirdiğin günlerle birikir";
  const catalog = ranks && ranks.length > 0 ? [...ranks].sort((a, b) => a.level - b.level) : null;
  const mine = me ? xpProgress(me.xp, me.level, catalog) : null;
  let mineBlock: ReactNode = null;
  if (me && mine) {
    const next = mine.nextMin == null ? "en yüksek rütbe" : `bir üst rütbeye ${fmtInt(mine.toNext)} XP`;
    mineBlock = (
      <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.card, padding: space.s3, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
          <RankAvatar name={me.displayName} avatarUrl={me.avatarUrl} level={me.level} size={40} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <RankLabel level={me.level} rankName={me.rankName} emphasis />
              <AppText variant="bodySm" tone="soft" maxFontSizeMultiplier={MAX_SCALE} style={{ fontSize: 13, lineHeight: 18 }}>
                · {me.level}. rütbe
              </AppText>
            </View>
            <AppText variant="bodySm" tone="soft" numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE} style={{ fontSize: 13, lineHeight: 18 }}>
              {fmtInt(me.xp)} XP · {next}
            </AppText>
          </View>
        </View>
        <ProgressBar value={mine.pct / 100} color={leagueColor(me.level, scheme)} track={colors.line} height={4} label={`Rütbe ilerlemesi yüzde ${mine.pct}`} />
      </View>
    );
  }
  return (
    <Sheet visible={visible} onClose={onClose} title="Rütbe sistemi" footer={<Button title="Anladım" onPress={onClose} />}>
      <AppText variant="bodySm" tone="soft">
        Puan, seçili dönemde verdiğin doğru cevap sayısıdır; sıralamayı o belirler ve her dönem sıfırlanır. {xpRule}, hiç sıfırlanmaz; rütbeni XP belirler. Her gün gelen, hafta sonu yığandan hızlı yükselir.
      </AppText>
      {mineBlock}
      {catalog ? (
        <View style={{ gap: space.s1 }}>
          <AppText variant="label" tone="subtle" accessibilityRole="header">
            Rütbeler
          </AppText>
          {catalog.map((item) => (
            <CatalogRow key={item.level} item={item} currentLevel={me?.level ?? null} />
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}
