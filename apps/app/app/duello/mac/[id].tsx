import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Check, Clock, Play, ScrollText, Swords, Trophy, UserPlus, X, Zap } from "lucide-react-native";
import { Alert, BackHandler, ScrollView, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AnswerStrip,
  CompareTable,
  ConnectionNotice,
  DuelAvatar,
  DuelCodeBox,
  DuelInviteSheet,
  DuelPodium,
  DuelScoreboard,
  DuelStatusLine,
  DuelTimerBar,
  LobbySeat,
  QuestionOption,
  QuestionStem,
  RevealCard,
  RevealPair,
  RewardTiles,
  RoomScoreboard,
  StandingList,
  type CountdownState,
  type OptionState,
  type RevealResult,
  type StandingRow,
} from "@/components/domain";
import { AppText, Button, Card, EmptyState, IconButton, Notice, Skeleton } from "@/components/ui";
import { mmss, points, seconds1, signed } from "@/features/duel/clock";
import { useDuelActions, useDuelFriends } from "@/features/duel/queries";
import type { DuelPlayer, DuelState } from "@/features/duel/types";
import { useDuelClock, useDuelMatch } from "@/features/duel/use-duel-match";
import { useMyId } from "@/features/duel/use-my-id";
import { ApiError } from "@/lib/api";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Maç ekranı (Doc 59) — lobi, geri sayım, soru, kapanış ve sonuç TEK ekrandadır; hangi yüzün
 * çizileceğini sunucudaki `phase` belirler (Figma 03–06, 22–25, 10–11). 1'e 1 ve salon aynı
 * ekranı kullanır. İstemci kural bilmez: süre, puan, sıra ve doğru cevap sunucudan gelir.
 */
export default function MacEkrani() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useMyId();
  const { state, isLoading, connection, gone, error, refetch, answer } = useDuelMatch(id ?? null);
  const clock = useDuelClock(state);
  const act = useDuelActions();
  const leaving = useRef(false);

  const live = !!state && (state.phase === "countdown" || state.phase === "question" || state.phase === "reveal");
  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/kutuphane"));
  const leave = () => {
    if (!state || leaving.current) return;
    if (state.phase === "finished" || state.phase === "cancelled") return close();
    const lobi = state.phase === "lobby";
    Alert.alert(lobi ? "Ayrılmak istiyor musun?" : "Maçtan ayrıl?", lobi ? (state.kind === "room" ? "Salondan çıkarsın; yerin boşalır." : "Kod geçersiz olur.") : "Maç yarıda biterse mağlubiyet sayılır.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Ayrıl",
        style: "destructive",
        onPress: () => {
          leaving.current = true;
          act.leave.mutate(state.matchId, { onSettled: close });
        },
      },
    ]);
  };
  // Android geri tuşu maçı sessizce kapatmasın.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      leave();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase, state?.matchId]);

  // Son saniyeler: cevap vermediysem her saniye hafif dokunsal uyarı.
  const lastBuzz = useRef(-1);
  useEffect(() => {
    if (state?.phase === "question" && clock.urgent && !state.myOptionId && clock.seconds !== lastBuzz.current) {
      lastBuzz.current = clock.seconds;
      void Haptics.selectionAsync();
    }
  }, [clock.seconds, clock.urgent, state?.phase, state?.myOptionId]);
  // Soru kapanışı: doğru/yanlış dokunsal geri bildirim (bir kez).
  const revealed = useRef(-1);
  useEffect(() => {
    if (state?.phase !== "reveal" || !state.reveal || revealed.current === state.index) return;
    revealed.current = state.index;
    const mine = state.reveal.results.find((r) => r.userId === myId);
    void Haptics.notificationAsync(mine?.isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  }, [state, myId]);

  const pad = { paddingTop: insets.top + space.s2, paddingBottom: insets.bottom + space.s4, paddingHorizontal: space.screenGutter };
  const shell = (children: React.ReactNode) => <View style={[{ flex: 1, backgroundColor: colors.bg }, pad]}>{children}</View>;

  if (gone || state?.phase === "cancelled")
    return shell(<EmptyState icon={Swords} title="Bu maç kapandı" body="Salon kapatılmış ya da maç iptal edilmiş olabilir." action={<Button title="Düelloya dön" onPress={close} />} />);
  if (isLoading || !state || !myId)
    return shell(
      <View style={{ gap: space.s4 }}>
        {error ? (
          <Notice tone="error" title="Maç yüklenemedi">
            {error.message}
          </Notice>
        ) : null}
        <Skeleton height={64} radiusKey="card" />
        <Skeleton height={120} radiusKey="card" />
        <Skeleton height={56} radiusKey="card" />
        {error ? <Button title="Yeniden dene" variant="secondary" onPress={() => void refetch()} /> : null}
      </View>,
    );

  const me = state.players.find((p) => p.userId === myId) ?? null;
  const others = state.players.filter((p) => p.userId !== myId);
  if (!me) return shell(<EmptyState icon={Swords} title="Bu maçın oyuncusu değilsin" action={<Button title="Düelloya dön" onPress={close} />} />);

  if (state.phase === "lobby") return shell(<Lobby state={state} me={me} onLeave={leave} />);
  if (state.phase === "countdown") return shell(<Countdown state={state} me={me} others={others} seconds={clock.seconds} />);
  if (state.phase === "finished") return shell(<Result state={state} me={me} others={others} onClose={close} />);

  // ── Soru ve kapanış
  const cs: CountdownState = state.phase === "reveal" ? "done" : clock.urgent ? "urgent" : "run";
  const secs = state.phase === "reveal" ? 0 : clock.seconds;
  const room = state.kind === "room";
  const standing = [...state.players].sort((a, b) => Number(a.left) - Number(b.left) || b.score - a.score || b.correctCount - a.correctCount);
  // Eşit puanlılar aynı sırayı paylaşır (0–0–0'da herkes 1.); gösterim için, karar sunucuda.
  const rankOf = (p: DuelPlayer) => 1 + standing.filter((o) => !o.left && (o.score > p.score || (o.score === p.score && o.correctCount > p.correctCount))).length;
  const myRank = rankOf(me);
  const opp = others[0];
  const reveal = state.reveal;
  const myRes = reveal?.results.find((r) => r.userId === myId) ?? null;
  const resultOf = (r: { optionId: string | null; isCorrect: boolean } | null | undefined): RevealResult => (!r || r.optionId == null ? "blank" : r.isCorrect ? "correct" : "wrong");
  const correctLabel = reveal ? (state.question?.options.find((o) => o.id === reveal.correctOptionId)?.label ?? "") : "";
  const waiting = others.filter((p) => !p.left && !p.answered).length;

  // Soru sunucuda kapandığı anda yapılan dokunuş (409) hata değildir: durum zaten yenilenir ve
  // kapanış ekranı sonucu gösterir. Pencere yalnız beklenmeyen hatalarda açılır; ağ kopması
  // alttaki bağlantı uyarısında görünür.
  const cevapHatasi = (e: Error) => {
    if (e instanceof ApiError && e.status !== 409) Alert.alert("Cevap alınmadı", e.message);
  };
  const optionState = (optionId: string): OptionState => {
    if (reveal) {
      if (optionId === reveal.correctOptionId) return myRes?.optionId === optionId ? "correct" : "missed";
      if (myRes?.optionId === optionId) return "incorrect";
      return "disabled";
    }
    if (state.myOptionId) return state.myOptionId === optionId ? "selected" : "disabled";
    return clock.expired ? "disabled" : "default";
  };

  return shell(
    <View style={{ flex: 1, gap: space.s3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <IconButton icon={X} label="Maçtan ayrıl" variant="ghost" onPress={leave} />
        <AppText variant="bodySm" tone="soft" numberOfLines={1} style={{ flex: 1 }}>
          {room ? (state.name ?? "Hızlı salon") : "1'e 1 düello"}
        </AppText>
      </View>
      {room ? (
        <RoomScoreboard rank={myRank} playerCount={state.players.filter((p) => !p.left).length} score={me.score} seconds={secs} clock={cs} index={state.index} total={state.questionCount} />
      ) : opp ? (
        <DuelScoreboard me={{ name: me.name, avatarUrl: me.avatarUrl, score: me.score }} opponent={{ name: opp.name, avatarUrl: opp.avatarUrl, score: opp.score, status: opp.left ? "left" : state.phase === "reveal" ? "idle" : opp.answered ? "answered" : "thinking" }} seconds={secs} clock={cs} index={state.index} total={state.questionCount} />
      ) : null}
      <DuelTimerBar fraction={clock.fraction} state={cs} />
      {room && state.phase === "question" ? <AnswerStrip players={state.players} /> : null}

      {/* Soru alanı kayar; sayaç ve durum satırı sabit kalır (küçük ekran + büyük yazı, Figma 50). */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space.s3, paddingVertical: space.s2 }} showsVerticalScrollIndicator>
        {room && reveal ? (
          <>
            <View style={{ flexDirection: "row" }}>
              <RevealCard mine who="Sen" gained={myRes?.points ?? 0} result={resultOf(myRes)} detail={myRes?.isCorrect ? undefined : `doğru cevap ${correctLabel}`} />
            </View>
            <AppText variant="heading" accessibilityRole="header">
              Anlık sıralama
            </AppText>
            <StandingList
              rows={standing.map<StandingRow>((p, i) => {
                const r = reveal.results.find((x) => x.userId === p.userId);
                return { userId: p.userId, rank: p.left ? i + 1 : rankOf(p), name: p.name, avatarUrl: p.avatarUrl, isMe: p.userId === myId, score: p.score, gained: r?.optionId == null ? null : r.points, left: p.left };
              })}
            />
          </>
        ) : state.question ? (
          <>
            <QuestionStem index={state.index + 1} total={state.questionCount} stem={state.question.stem} mediaUrl={state.question.mediaUrl} counter={false} />
            <View style={{ gap: space.s2 }}>
              {state.question.options.map((o) => (
                <QuestionOption key={o.id} label={o.label} text={o.text} state={optionState(o.id)} onPress={() => answer.mutate({ index: state.index, optionId: o.id }, { onError: cevapHatasi })} />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={{ gap: space.s2 }}>
        <ConnectionNotice connection={connection} onRetry={() => void refetch()} />
        {reveal && !room && opp ? (
          <RevealPair
            me={{ gained: myRes?.points ?? 0, result: resultOf(myRes), detail: myRes?.isCorrect ? undefined : `doğru cevap ${correctLabel}` }}
            opponent={{ name: opp.name, gained: reveal.results.find((r) => r.userId === opp.userId)?.points ?? 0, result: resultOf(reveal.results.find((r) => r.userId === opp.userId)) }}
          />
        ) : null}
        {state.phase === "reveal" ? (
          <DuelStatusLine text={state.index + 1 >= state.questionCount ? "Sonuç hazırlanıyor" : `Sonraki soru ${Math.max(1, clock.seconds)} sn içinde`} />
        ) : state.myOptionId ? (
          <DuelStatusLine check text={waiting > 0 ? (room ? `Cevabın kilitlendi · ${waiting} kişi bekleniyor` : `Cevabın kilitlendi · ${opp?.name ?? "rakip"} düşünüyor`) : "Cevabın kilitlendi"} />
        ) : clock.urgent ? (
          <DuelStatusLine tone="danger" text="Süre bitince soru boş sayılır" />
        ) : (
          <DuelStatusLine text={live && opp && !room && opp.answered ? `${opp.name} cevapladı` : "Bir şık seç; seçim değiştirilemez"} />
        )}
      </View>
    </View>,
  );
}

/* ---------------------------------------------------------------- Lobi */

function Lobby({ state, me, onLeave }: { state: DuelState; me: DuelPlayer; onLeave: () => void }) {
  const { colors, space } = useTheme();
  const act = useDuelActions();
  const [invite, setInvite] = useState(false);
  const now = useNow(1000, !!state.codeExpiresAt);
  const room = state.kind === "room";
  const inside = state.players.filter((p) => !p.left);
  const hata = (e: Error) => Alert.alert("İşlem yapılamadı", e.message);
  const share = () => state.code && void Share.share({ message: `Paemisyon'da ${room ? "salona" : "düelloya"} gel. Kod: ${state.code}` });
  const copy = () => state.code && void Clipboard.setStringAsync(state.code);
  const kalan = state.codeExpiresAt ? Date.parse(state.codeExpiresAt) - (now + state.offsetMs) : null;

  if (!room)
    return (
      <View style={{ flex: 1, gap: space.s5 }}>
        <IconButton icon={X} label="Vazgeç" onPress={onLeave} />
        <View style={{ flex: 1, justifyContent: "center", gap: space.s5 }}>
          <View style={{ gap: space.s2 }}>
            <AppText variant="title" accessibilityRole="header">
              Arkadaşın bekleniyor
            </AppText>
            <AppText variant="bodySm" tone="soft">
              Kodu gönder; girdiği an 3 saniyelik geri sayım başlar.
            </AppText>
          </View>
          {state.code ? <DuelCodeBox code={state.code} hint={kalan != null && kalan > 0 ? `${mmss(kalan)} geçerli · tek kullanımlık` : "Kodun süresi doldu"} onCopy={copy} onShare={share} /> : <Notice tone="warning">Kodun süresi doldu. Geri dönüp yeni kod üret.</Notice>}
        </View>
        <Button title="Vazgeç" variant="secondary" onPress={onLeave} />
      </View>
    );

  const quick = state.name == null;
  const ready = inside.filter((p) => p.isReady).length;
  const min = 3;
  const canStart = me.isHost && !quick && inside.length >= min && inside.every((p) => p.isHost || p.isReady);
  const info = inside.length < min ? `Başlamak için en az ${min} kişi gerekir · şu an ${inside.length}` : quick ? `${ready} / ${inside.length} hazır · herkes hazır olunca kendiliğinden başlar` : me.isHost ? (canStart ? "Herkes hazır." : "Herkes hazır olunca başlatabilirsin. Oyuncuyu çıkarmak için adına basılı tut.") : "Başkan başlatınca herkes için aynı anda 3 saniyelik geri sayım açılır.";
  const seats = Array.from({ length: state.maxPlayers }, (_, i) => inside[i] ?? null);
  const rows = Array.from({ length: Math.ceil(seats.length / 2) }, (_, r) => seats.slice(r * 2, r * 2 + 2));
  const kick = (p: DuelPlayer) =>
    Alert.alert(`${p.name} salondan çıkarılsın mı?`, "Çıkarılan oyuncu bu salona geri giremez.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkar", style: "destructive", onPress: () => act.kick.mutate({ id: state.matchId, userId: p.userId }, { onError: hata }) },
    ]);

  return (
    <View style={{ flex: 1, gap: space.s3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
        <IconButton icon={X} label="Salondan ayrıl" onPress={onLeave} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="heading" accessibilityRole="header" numberOfLines={1}>
            {state.name ?? "Hızlı salon"}
          </AppText>
          <AppText variant="bodySm" tone="soft" numberOfLines={2}>
            {state.questionCount} soru · {state.secondsPerQuestion} sn · {state.isPublic ? "Herkese açık" : "Özel"}
          </AppText>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space.s4, paddingVertical: space.s2 }}>
        {state.code ? <DuelCodeBox compact code={state.code} onCopy={copy} onShare={share} /> : null}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2 }}>
          <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
            Oyuncular · {inside.length} / {state.maxPlayers}
          </AppText>
          <Button title="Davet et" size="sm" variant="secondary" icon={<UserPlus size={16} color={colors.ink} />} onPress={() => setInvite(true)} />
        </View>
        <View style={{ gap: space.s2 }}>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.s2 }}>
              {row.map((p, k) => (
                <LobbySeat key={p?.userId ?? `bos-${i}-${k}`} player={p ? { name: p.name, avatarUrl: p.avatarUrl, isHost: p.isHost, isReady: p.isReady, isMe: p.userId === me.userId } : null} onLongPress={p && me.isHost && !p.isHost ? () => kick(p) : undefined} />
              ))}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ gap: space.s2 }}>
        <AppText variant="bodySm" tone="soft" accessibilityLiveRegion="polite" style={{ textAlign: "center" }}>
          {info}
        </AppText>
        {me.isHost && !quick ? (
          <Button title="Oyunu başlat" icon={<Play size={20} color={colors.onAccent} />} disabled={!canStart} loading={act.start.isPending} onPress={() => act.start.mutate(state.matchId, { onError: hata })} />
        ) : me.isHost && quick ? null : (
          <Button title={me.isReady ? "Hazır değilim" : "Hazırım"} variant={me.isReady ? "secondary" : "primary"} icon={me.isReady ? undefined : <Check size={20} color={colors.onAccent} />} loading={act.ready.isPending} onPress={() => act.ready.mutate({ id: state.matchId, ready: !me.isReady }, { onError: hata })} />
        )}
      </View>
      <DuelInviteSheet visible={invite} onClose={() => setInvite(false)} scope={state.scope} roomId={state.matchId} />
    </View>
  );
}

/* ---------------------------------------------------------------- Geri sayım */

function Countdown({ state, me, others, seconds }: { state: DuelState; me: DuelPlayer; others: DuelPlayer[]; seconds: number }) {
  const { colors, radius, space } = useTheme();
  const room = state.kind === "room";
  const opp = others[0];
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: space.s8 }}>
      <AppText variant="label" tone="accent">
        {room ? `${state.players.length} oyuncu hazır` : "Rakibin hazır"}
      </AppText>
      {room ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: space.s2 }}>
          {state.players.map((p) => (
            <DuelAvatar key={p.userId} name={p.name} avatarUrl={p.avatarUrl} size={48} ring={p.userId === me.userId ? "accent" : "line"} />
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, alignSelf: "stretch" }}>
          {[{ p: me, mine: true }, { p: opp, mine: false }].flatMap(({ p, mine }, i) => [
            i === 1 ? (
              <AppText key="vs" variant="heading" tone="soft" maxFontSizeMultiplier={1.3}>
                vs
              </AppText>
            ) : null,
            <View key={mine ? "ben" : "rakip"} style={{ flex: 1, minWidth: 0, alignItems: "center", gap: space.s2, paddingVertical: space.s5, paddingHorizontal: space.s2, borderRadius: radius.card, borderWidth: 1, borderColor: mine ? colors.accent : colors.line, backgroundColor: colors.surface }}>
              <DuelAvatar name={p?.name ?? "?"} avatarUrl={p?.avatarUrl} size={72} ring={mine ? "accent" : "line"} />
              <AppText variant="subhead" numberOfLines={2} maxFontSizeMultiplier={1.3} style={{ textAlign: "center" }}>
                {mine ? "Sen" : (p?.name ?? "Rakip")}
              </AppText>
            </View>,
          ])}
        </View>
      )}
      <View style={{ alignItems: "center" }} accessible accessibilityRole="timer" accessibilityLabel={`Başlamasına ${seconds} saniye`} accessibilityLiveRegion="assertive">
        <AppText variant="hero" tone="gold" maxFontSizeMultiplier={1}>
          {Math.max(1, seconds)}
        </AppText>
        <AppText variant="bodySm" tone="soft">
          Başlıyor
        </AppText>
      </View>
      <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
        {state.questionCount} soru · soru başına {state.secondsPerQuestion} saniye · hızlı doğru cevap fazladan puan getirir.
      </AppText>
    </View>
  );
}

/* ---------------------------------------------------------------- Sonuç */

function Result({ state, me, others, onClose }: { state: DuelState; me: DuelPlayer; others: DuelPlayer[]; onClose: () => void }) {
  const router = useRouter();
  const { colors, space } = useTheme();
  const act = useDuelActions();
  const room = state.kind === "room";
  const opp = others[0];
  const wrong = me.wrongCount + me.blankCount;
  // 1'e 1 sonunda rakibi arkadaş ekleme; zaten arkadaş ya da istek bekliyorsa düğme çizilmez.
  const friends = useDuelFriends(!room && !!opp);
  const tanidik = friends.data ? [...friends.data.friends, ...friends.data.incoming, ...friends.data.outgoing].some((f) => f.userId === opp?.userId) : true;
  const arkadasEklenebilir = !room && !!opp && !tanidik;
  const win = me.outcome === "win";
  const iconColor = win || (room && (me.placement ?? 9) <= 3) ? colors.accentInk : colors.inkSoft;
  const review = () => router.push({ pathname: "/duello/inceleme/[id]", params: { id: state.matchId } });
  const rewards = [
    { icon: <Zap size={18} strokeWidth={1.75} color={iconColor} />, value: `+${me.xp ?? 0} XP`, label: "Kazanılan" },
    { icon: <Trophy size={18} strokeWidth={1.75} color={iconColor} />, value: signed(me.ratingDelta ?? 0), label: room ? "Salon puanı" : "Lig puanı" },
    room
      ? { icon: <Check size={18} strokeWidth={1.75} color={iconColor} />, value: `${me.correctCount} / ${state.questionCount}`, label: `Doğru · ort. ${seconds1(me.avgAnswerMs)}` }
      : { icon: <Clock size={18} strokeWidth={1.75} color={iconColor} />, value: seconds1(me.avgAnswerMs), label: "Ortalama süre" },
  ];
  const secondary = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
      {arkadasEklenebilir ? (
        <Button style={{ flexGrow: 1, flexBasis: 140 }} size="sm" variant="secondary" title={act.friendRequest.isSuccess ? "İstek gönderildi" : `${opp!.name} ekle`} icon={<UserPlus size={18} color={colors.ink} />} disabled={act.friendRequest.isSuccess} loading={act.friendRequest.isPending} onPress={() => act.friendRequest.mutate(opp!.userId, { onError: (e) => Alert.alert("İstek gönderilemedi", e.message) })} />
      ) : null}
      {wrong > 0 ? <Button style={{ flexGrow: 1, flexBasis: 140 }} size="sm" variant="secondary" title={`Yanlışlarım (${wrong})`} icon={<ScrollText size={18} color={colors.ink} />} onPress={review} /> : null}
      <Button style={{ flexGrow: 1, flexBasis: 140 }} size="sm" variant="secondary" title={room ? "Salondan çık" : "Düelloya dön"} onPress={onClose} />
    </View>
  );

  if (room) {
    const sorted = [...state.players].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
    const baslik = me.placement === 1 ? "Birinci oldun" : me.placement === 2 ? "İkinci oldun" : me.placement === 3 ? "Üçüncü oldun" : `${me.placement}. oldun`;
    return (
      <View style={{ flex: 1, gap: space.s3 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space.s4, paddingVertical: space.s3 }}>
          <View style={{ alignItems: "center", gap: 4 }}>
            <AppText variant="title" accessibilityRole="header" style={{ textAlign: "center" }}>
              {baslik}
            </AppText>
            <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
              {state.name ?? "Hızlı salon"} · {state.players.length} oyuncu · {state.questionCount} soru
            </AppText>
          </View>
          <DuelPodium rows={sorted.filter((p) => (p.placement ?? 99) <= 3).map((p) => ({ userId: p.userId, placement: p.placement!, name: p.name, avatarUrl: p.avatarUrl, score: p.score, isMe: p.userId === me.userId }))} />
          {sorted.some((p) => (p.placement ?? 0) > 3) ? (
            <StandingList rows={sorted.filter((p) => (p.placement ?? 0) > 3).map((p) => ({ userId: p.userId, rank: p.placement!, name: p.name, avatarUrl: p.avatarUrl, isMe: p.userId === me.userId, score: p.score, note: `${p.correctCount} doğru${p.left ? " · ayrıldı" : ""}`, left: p.left }))} />
          ) : null}
          <RewardTiles items={rewards} muted={(me.placement ?? 9) > 3} />
        </ScrollView>
        <View style={{ gap: space.s2 }}>
          <Button title="Yeni salona gir" icon={<Play size={20} color={colors.onAccent} />} loading={act.quickRoom.isPending} onPress={() => act.quickRoom.mutate(undefined, { onSuccess: (m) => router.replace({ pathname: "/duello/mac/[id]", params: { id: m.matchId } }), onError: (e) => Alert.alert("Salona girilemedi", e.message) })} />
          {secondary}
        </View>
      </View>
    );
  }

  const title = me.outcome === "win" ? "Kazandın" : me.outcome === "draw" ? "Berabere" : "Kaybettin";
  const sub = opp?.left ? `${opp.name} maçtan ayrıldı` : me.outcome === "draw" ? "Puan, doğru sayısı ve süre eşit" : `${opp?.name ?? "Rakip"} karşısında`;
  const rematch = () =>
    opp &&
    act.invite.mutate(
      { toUserId: opp.userId, scope: state.scope },
      { onSuccess: () => Alert.alert("Rövanş daveti gönderildi", `${opp.name} kabul ederse maç kendiliğinden açılır.`, [{ text: "Tamam", onPress: onClose }]), onError: (e) => Alert.alert("Davet gönderilemedi", e.message) },
    );
  return (
    <View style={{ flex: 1, gap: space.s3 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space.s4, paddingVertical: space.s3 }}>
        <View style={{ alignItems: "center", gap: 6 }}>
          {win ? (
            <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
              <Trophy size={28} strokeWidth={1.75} color={colors.accentInk} />
            </View>
          ) : null}
          <AppText variant="title" accessibilityRole="header" style={{ textAlign: "center" }}>
            {title}
          </AppText>
          <AppText variant="bodySm" tone="soft" style={{ textAlign: "center" }}>
            {sub}
          </AppText>
        </View>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: space.s2, padding: space.s4 }}>
          {[{ p: me, mine: true }, { p: opp, mine: false }].map(({ p, mine }, i) => (
            <View key={i} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.s2 }}>
              {i === 1 ? (
                <AppText variant="heading" tone="soft">
                  –
                </AppText>
              ) : null}
              <View accessible accessibilityLabel={`${mine ? "Sen" : (p?.name ?? "Rakip")}: ${p?.score ?? 0} puan`} style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 6 }}>
                <DuelAvatar name={p?.name ?? "?"} avatarUrl={p?.avatarUrl} size={44} ring={mine ? "accent" : "line"} dim={p?.left} />
                <AppText variant="display" tone={(p?.placement ?? 9) === 1 ? "ink" : "soft"} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15} style={{ fontSize: 34, lineHeight: 40 }}>
                  {points(p?.score ?? 0)}
                </AppText>
                <AppText variant="bodySm" tone="soft" numberOfLines={1}>
                  {mine ? "Sen" : (p?.name ?? "Rakip")}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
        <RewardTiles items={rewards} muted={!win} />
        {opp ? (
          <CompareTable
            rows={[
              { label: "Doğru", mine: String(me.correctCount), theirs: String(opp.correctCount) },
              { label: "Yanlış", mine: String(me.wrongCount), theirs: String(opp.wrongCount) },
              { label: "Boş", mine: String(me.blankCount), theirs: String(opp.blankCount) },
              { label: "Ortalama süre", mine: seconds1(me.avgAnswerMs), theirs: seconds1(opp.avgAnswerMs) },
            ]}
          />
        ) : null}
      </ScrollView>
      <View style={{ gap: space.s2 }}>
        {opp && !opp.left ? <Button title="Rövanş iste" icon={<Swords size={20} color={colors.onAccent} />} loading={act.invite.isPending} onPress={rematch} /> : <Button title="Yeni rakip bul" icon={<Zap size={20} color={colors.onAccent} />} onPress={onClose} />}
        {secondary}
      </View>
    </View>
  );
}
