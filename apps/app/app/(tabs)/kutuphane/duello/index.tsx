import { useRouter } from "expo-router";
import { useState } from "react";
import { BookOpen, ChartNoAxesColumn, ChevronLeft, ChevronRight, Crown, Flame, Link2, Play, Search, Swords, Trophy, Zap } from "lucide-react-native";
import { Alert, Pressable, View } from "react-native";
import { DuelAvatar, DuelCodeSheet, DuelInviteSheet, DuelPlayerRow, DuelScopeSheet, MIXED_SCOPE, type PickedScope } from "@/components/domain";
import { AppText, Button, Card, ChoiceTabs, EmptyState, IconButton, Notice, ProgressBar, Screen, SectionHeader, Skeleton, useSheetAction } from "@/components/ui";
import { mmss, points } from "@/features/duel/clock";
import { useDuelActions, useDuelHub, useDuelPlayers, useOpenRooms } from "@/features/duel/queries";
import { useDuelInbox } from "@/features/duel/use-duel-match";
import { useMyId } from "@/features/duel/use-my-id";
import { useStudyHub } from "@/features/rooms/queries";
import { ApiError } from "@/lib/api";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";

type Mode = "duel" | "room";
const ICERIK_EN = 600;

/**
 * Düello merkezi (Doc 59 · Figma 01 "Merkez · 1'e 1", 20 "Merkez · Salon", 12 "maça geri dön").
 * Hak, istatistik, davetler ve kurallar `/me/duel`'den; istemci kural bilmez. Bu ekran açıkken
 * merkez çağrısı yarım dakikada bir yinelenir ve "çevrimiçiyim" sinyali olur.
 */
export default function DuelloMerkez() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const [mode, setMode] = useState<Mode>("duel");
  const [scope, setScope] = useState<PickedScope>(MIXED_SCOPE);
  const [kodHata, setKodHata] = useState<string | null>(null);
  const konu = useSheetAction();
  const kod = useSheetAction();
  const cagir = useSheetAction();

  const hub = useDuelHub();
  const study = useStudyHub();
  const online = useDuelPlayers("", mode === "duel" && hub.isSuccess);
  const rooms = useOpenRooms(mode === "room" && hub.isSuccess);
  const act = useDuelActions();
  const myId = useMyId();
  const now = useNow(1000, (hub.data?.invitations.incoming.length ?? 0) > 0);
  const openMatch = (id: string) => router.push({ pathname: "/duello/mac/[id]", params: { id } });
  useDuelInbox(myId, (e) => {
    if (e.event === "matched" && e.matchId) openMatch(e.matchId);
  });

  const hata = (baslik: string) => (e: Error) => {
    if (e instanceof ApiError && e.code === "duel_daily_limit") {
      Alert.alert("Bugünkü hakkın doldu", e.message, [{ text: "Tamam", style: "cancel" }, { text: "Premium'u gör", onPress: () => router.push("/paywall") }]);
    } else Alert.alert(baslik, e.message);
  };

  if (hub.isPending)
    return (
      <Screen>
        <Skeleton height={40} width="50%" />
        <Skeleton height={48} radiusKey="control" />
        <Skeleton height={170} radiusKey="card" />
        <Skeleton height={56} radiusKey="card" />
      </Screen>
    );
  if (hub.isError)
    return (
      <Screen>
        {hub.error instanceof ApiError && hub.error.status === 404 ? (
          <EmptyState icon={Swords} title="Düello yakında" body="Bu özellik henüz hesabına açılmadı." action={<Button title="Geri dön" variant="secondary" onPress={() => router.back()} />} />
        ) : (
          <Notice tone="error" title="Düello yüklenemedi">
            {hub.error.message}
          </Notice>
        )}
      </Screen>
    );

  const d = hub.data;
  const hakBitti = d.daily.remaining === 0;
  const gelen = d.invitations.incoming;

  const rakipBul = () =>
    act.enqueue.mutate(scope, {
      onSuccess: (r) => {
        if (r.status === "matched") openMatch(r.matchId);
        else router.push({ pathname: "/duello/ara", params: { scopeKind: scope.kind, scopeId: scope.id ?? "", label: scope.label } });
      },
      onError: hata("Eşleşme başlatılamadı"),
    });
  const kodlaKatil = (code: string) => {
    setKodHata(null);
    act.joinCode.mutate(code, { onSuccess: (m) => kod.closeThen(() => openMatch(m.matchId)), onError: (e) => setKodHata(e.message) });
  };
  const kodUret = () => act.createCode.mutate(scope, { onSuccess: (m) => kod.closeThen(() => openMatch(m.matchId)), onError: (e) => setKodHata(e.message) });
  const hizliSalon = () => act.quickRoom.mutate(undefined, { onSuccess: (m) => openMatch(m.matchId), onError: hata("Salona girilemedi") });

  const s = d.stats;
  return (
    <>
      <Screen style={{ alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: ICERIK_EN, gap: space.s5 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
            <IconButton icon={ChevronLeft} label="Geri" onPress={() => router.back()} />
            <View style={{ flex: 1 }} />
            <HeadPill icon={ChartNoAxesColumn} label="İstatistik" onPress={() => router.push("/(tabs)/kutuphane/duello/istatistik")} />
            <HeadPill icon={Trophy} label="Sıralama" accent onPress={() => router.push("/(tabs)/kutuphane/duello/siralama")} />
          </View>
          <View style={{ gap: 6 }}>
            <AppText variant="title" accessibilityRole="header">
              Düello
            </AppText>
            <AppText variant="bodySm" tone="soft">
              {mode === "duel"
                ? `${d.rules.duel.questionCount} soru, ${d.rules.duel.secondsPerQuestion}'şer saniye. İkinize de aynı sorular.`
                : `${d.rules.room.minPlayers}–${d.rules.room.maxPlayers} kişi, aynı sorular, aynı anda. Sonunda kürsü.`}
            </AppText>
          </View>

          <ChoiceTabs
            variant="segmented"
            label="Oyun modu"
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: "duel", label: "1'e 1" },
              { value: "room", label: `Salon · ${d.rules.room.minPlayers}–${d.rules.room.maxPlayers} kişi` },
            ]}
          />

          {d.activeMatchId ? (
            <Card tone="accent" style={{ borderColor: colors.accent, borderWidth: 1 }}>
              <AppText variant="heading">Maçın sürüyor</AppText>
              <AppText variant="bodySm" tone="soft">
                Sen yokken geçen sorular boş sayılır; süre senin için durmaz.
              </AppText>
              <Button title="Maça dön" icon={<Play size={20} color={colors.onAccent} />} onPress={() => openMatch(d.activeMatchId!)} />
            </Card>
          ) : null}

          {/* Puan kartı */}
          <Card style={{ gap: space.s4, padding: space.s4 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.s3, flexWrap: "wrap" }}>
              <View>
                <AppText variant="bodySm" tone="soft">
                  {mode === "duel" ? "Lig puanı" : "Salon puanı"}
                </AppText>
                <AppText variant="display" maxFontSizeMultiplier={1.15} style={{ fontSize: 40, lineHeight: 46 }}>
                  {points(mode === "duel" ? s.rating : s.roomRating)}
                </AppText>
              </View>
              {mode === "duel" && s.currentStreak >= 2 ? (
                <View style={{ minHeight: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: space.s3, borderRadius: 16, backgroundColor: colors.accentSoft }}>
                  <Flame size={16} strokeWidth={2} color={colors.accentInk} />
                  <AppText variant="bodySm" tone="accent">
                    {s.currentStreak} galibiyet serisi
                  </AppText>
                </View>
              ) : null}
            </View>
            <View style={{ flexDirection: "row", gap: space.s2 }}>
              {(mode === "duel"
                ? [
                    [String(s.duels), "Düello"],
                    [String(s.wins), "Galibiyet"],
                    [s.winRate == null ? "—" : `%${s.winRate}`, "Kazanma"],
                  ]
                : [
                    [String(s.rooms), "Salon"],
                    [String(s.roomWins), "Birincilik"],
                    [String(s.xpEarned), "XP"],
                  ]
              ).map(([v, l]) => (
                <View key={l} accessible accessibilityLabel={`${l}: ${v}`} style={{ flex: 1, minWidth: 0, paddingVertical: 10, paddingHorizontal: space.s3, borderRadius: radius.control, backgroundColor: colors.surfaceAlt }}>
                  <AppText variant="stat" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={1.3}>
                    {v}
                  </AppText>
                  <AppText variant="bodySm" tone="soft" numberOfLines={1} maxFontSizeMultiplier={1.3}>
                    {l}
                  </AppText>
                </View>
              ))}
            </View>
            {d.daily.limit > 0 ? (
              <View style={{ gap: space.s2 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.s2, flexWrap: "wrap" }}>
                  <AppText variant="bodySm">
                    Bugün {Math.min(d.daily.used, d.daily.limit)} / {d.daily.limit} maç
                  </AppText>
                  <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.push("/paywall")}>
                    <AppText variant="bodySm" tone="accent">
                      Premium ile sınırsız
                    </AppText>
                  </Pressable>
                </View>
                <ProgressBar value={d.daily.used / d.daily.limit} height={4} label="Bugünkü maç hakkı" />
              </View>
            ) : null}
          </Card>

          {hakBitti ? (
            <Notice tone="warning" title="Bugünkü ücretsiz maç hakkın doldu">
              {"Yarın yeniden oynayabilirsin. Premium'da günlük sınır yok."}
            </Notice>
          ) : null}

          {mode === "duel" ? (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel={`Konu: ${scope.label}. Değiştir`} onPress={konu.open} style={({ pressed }) => ({ minHeight: 64, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s3, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}>
                <BookOpen size={22} strokeWidth={1.75} color={colors.inkSoft} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="bodySm" tone="soft">
                    Konu
                  </AppText>
                  <AppText variant="subhead" numberOfLines={2}>
                    {scope.label}
                  </AppText>
                </View>
                <AppText variant="bodySm" tone="accent">
                  Değiştir
                </AppText>
                <ChevronRight size={18} strokeWidth={1.75} color={colors.inkSoft} />
              </Pressable>

              <View style={{ gap: space.s2 }}>
                <Button title="Rakip bul" icon={<Zap size={20} color={colors.onAccent} />} loading={act.enqueue.isPending} disabled={hakBitti || !!d.activeMatchId} onPress={rakipBul} />
                <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
                  Kendi sınavından, aynı konuyu seçmiş biriyle eşleşirsin.
                </AppText>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s3 }}>
                <Button style={{ flexGrow: 1, flexBasis: 150 }} size="sm" variant="secondary" title={d.friendRequestCount ? `Arkadaşlar · ${d.friendRequestCount} istek` : "Arkadaşını çağır"} icon={<Search size={18} color={colors.ink} />} disabled={hakBitti} onPress={cagir.open} />
                <Button style={{ flexGrow: 1, flexBasis: 150 }} size="sm" variant="secondary" title="Kodla oyna" icon={<Link2 size={18} color={colors.ink} />} disabled={hakBitti} onPress={() => (setKodHata(null), kod.open())} />
              </View>
            </>
          ) : (
            <>
              <View style={{ gap: space.s2 }}>
                <Button title="Hızlı salona katıl" icon={<Zap size={20} color={colors.onAccent} />} loading={act.quickRoom.isPending} disabled={hakBitti || !!d.activeMatchId} onPress={hizliSalon} />
                <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
                  Dolmak üzere olan açık salona girersin; yoksa yenisi açılır.
                </AppText>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s3 }}>
                <Button style={{ flexGrow: 1, flexBasis: 150 }} size="sm" variant="secondary" title="Salon kur" icon={<Crown size={18} color={colors.ink} />} disabled={hakBitti || !!d.activeMatchId} onPress={() => router.push("/duello/salon-kur")} />
                <Button style={{ flexGrow: 1, flexBasis: 150 }} size="sm" variant="secondary" title="Kodla katıl" icon={<Link2 size={18} color={colors.ink} />} disabled={hakBitti} onPress={() => (setKodHata(null), kod.open())} />
              </View>
            </>
          )}

          {gelen.map((dv) => {
            const kalan = Date.parse(dv.expiresAt) - now;
            if (kalan <= 0) return null;
            return (
              <Card key={dv.id} tone="accent" style={{ borderWidth: 1, borderColor: colors.accent, padding: space.s4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
                  <DuelAvatar name={dv.name} avatarUrl={dv.avatarUrl} size={44} ring="accent" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="subhead">{dv.roomId ? `${dv.name} seni salona çağırıyor` : `${dv.name} seni çağırıyor`}</AppText>
                    <AppText variant="bodySm" tone="soft">
                      {dv.roomId ? "Salon daveti" : "1'e 1 düello"}
                    </AppText>
                  </View>
                  <AppText variant="subhead" tone="accent" maxFontSizeMultiplier={1.3} style={{ fontVariant: ["tabular-nums"] }}>
                    {mmss(kalan)}
                  </AppText>
                </View>
                <View style={{ flexDirection: "row", gap: space.s3 }}>
                  <Button style={{ flex: 1 }} size="sm" variant="secondary" title="Reddet" onPress={() => act.respond.mutate({ id: dv.id, accept: false })} />
                  <Button style={{ flex: 1 }} size="sm" title="Kabul et" loading={act.respond.isPending} onPress={() => act.respond.mutate({ id: dv.id, accept: true }, { onSuccess: (r) => r.matchId && openMatch(r.matchId), onError: hata("Davet kabul edilemedi") })} />
                </View>
              </Card>
            );
          })}

          {mode === "duel" ? (
            <View style={{ gap: space.s3 }}>
              <SectionHeader title="Şu an çevrimiçi" action={online.data ? `${online.data.onlineCount} kişi` : undefined} />
              {online.isPending ? (
                <Skeleton height={64} radiusKey="card" />
              ) : (online.data?.items.length ?? 0) === 0 ? (
                <AppText variant="bodySm" tone="soft">
                  {"Şu an kendi sınavından çevrimiçi kimse yok. “Arkadaşını çağır” ile adıyla arayabilirsin."}
                </AppText>
              ) : (
                <Card style={{ padding: 0, gap: 0 }}>
                  {online.data!.items.slice(0, 8).map((p, i) => (
                    <DuelPlayerRow
                      key={p.userId}
                      divider={i > 0}
                      name={p.name}
                      avatarUrl={p.avatarUrl}
                      online
                      noteTone={p.invited ? "accent" : "soft"}
                      note={p.invited ? "Davet gönderildi" : p.inMatch ? "Şu an maçta" : `Lig ${points(p.rating)}${p.winRate == null ? " · ilk maçları" : ` · %${p.winRate} kazanma`}`}
                      action={<Button title="Çağır" size="sm" variant="secondary" disabled={p.invited || p.inMatch || hakBitti || act.invite.isPending} onPress={() => act.invite.mutate({ toUserId: p.userId, scope }, { onError: hata("Davet gönderilemedi") })} />}
                    />
                  ))}
                </Card>
              )}
              <AppText variant="bodySm" tone="subtle">
                Yalnız kendi sınavının adaylarını görürsün; sorular o sınavın müfredatından gelir.
              </AppText>
            </View>
          ) : (
            <View style={{ gap: space.s3 }}>
              <SectionHeader title="Açık salonlar" action={rooms.data?.length ? `${rooms.data.length} salon` : undefined} />
              {rooms.isPending ? (
                <Skeleton height={64} radiusKey="card" />
              ) : (rooms.data?.length ?? 0) === 0 ? (
                <AppText variant="bodySm" tone="soft">
                  Şu an açık salon yok. Hızlı salona gir ya da kendin kur.
                </AppText>
              ) : (
                <Card style={{ padding: 0, gap: 0 }}>
                  {rooms.data!.map((r, i) => (
                    <View key={r.matchId} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s3, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                      <View style={{ width: 40, height: 40, borderRadius: radius.control, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
                        <AppText variant="subhead" maxFontSizeMultiplier={1.2}>
                          {r.players}
                        </AppText>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="subhead" numberOfLines={1}>
                          {r.name}
                        </AppText>
                        <AppText variant="bodySm" tone="soft" numberOfLines={2}>
                          {r.players} / {r.maxPlayers} · {r.scopeLabel} · {r.questionCount} soru
                        </AppText>
                      </View>
                      <Button title="Katıl" size="sm" variant="secondary" disabled={hakBitti || act.joinRoom.isPending} onPress={() => act.joinRoom.mutate(r.matchId, { onSuccess: (m) => openMatch(m.matchId), onError: hata("Salona girilemedi") })} />
                    </View>
                  ))}
                </Card>
              )}
            </View>
          )}
        </View>
      </Screen>

      <DuelScopeSheet visible={konu.visible} onClose={konu.close} moduleId={study.data?.module?.id ?? null} value={scope} onPick={setScope} />
      <DuelCodeSheet mode={mode} visible={kod.visible} onClose={kod.close} onDismissed={kod.onDismissed} onCreate={mode === "duel" ? kodUret : undefined} onJoin={kodlaKatil} creating={act.createCode.isPending} joining={act.joinCode.isPending} error={kodHata} />
      <DuelInviteSheet visible={cagir.visible} onClose={cagir.close} scope={scope} />
    </>
  );
}

function HeadPill({ icon: Icon, label, onPress, accent = false }: { icon: typeof Trophy; label: string; onPress: () => void; accent?: boolean }) {
  const { colors, space } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}>
      <Icon size={18} strokeWidth={1.75} color={accent ? colors.accentInk : colors.inkSoft} />
      <AppText variant="bodySm" maxFontSizeMultiplier={1.3}>
        {label}
      </AppText>
    </Pressable>
  );
}
