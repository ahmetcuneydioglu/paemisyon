import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { BookOpen, Check, ChevronLeft, ChevronRight, Shuffle, UserPlus } from "lucide-react-native";
import { AppText, Button, Card, IconButton, Notice, Sheet, Skeleton, TextField } from "@/components/ui";
import { useCourses, useCourseTopics } from "@/features/catalog/queries";
import { mmss } from "@/features/duel/clock";
import { useDuelActions, useDuelFriends, useDuelHub, useDuelPlayers } from "@/features/duel/queries";
import type { DuelPlayerRow as DuelPlayerRowData, DuelScope } from "@/features/duel/types";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";
import { DuelPlayerRow } from "./duel";

/** Düello alt sayfaları (Doc 59 · Figma 07, 08, 09): konu seçimi, kodla oyna, oyuncu çağır. */

export interface PickedScope extends DuelScope {
  label: string;
}
export const MIXED_SCOPE: PickedScope = { kind: "mixed", id: null, label: "Karışık" };

function ScopeRow({ title, note, selected, onPress, chevron = false, icon }: { title: string; note?: string; selected?: boolean; onPress: () => void; chevron?: boolean; icon?: "mix" | "book" }) {
  const { colors, radius, space } = useTheme();
  const Icon = icon === "mix" ? Shuffle : BookOpen;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}${note ? `, ${note}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: 56, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s3, borderRadius: radius.control, borderWidth: selected ? 1.5 : 1, borderColor: selected ? colors.accent : colors.line, backgroundColor: selected ? colors.accentSoft : pressed ? colors.surfaceAlt : colors.bg })}
    >
      {icon ? <Icon size={20} strokeWidth={1.75} color={selected ? colors.accentInk : colors.inkSoft} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="subhead">{title}</AppText>
        {note ? (
          <AppText variant="bodySm" tone="soft">
            {note}
          </AppText>
        ) : null}
      </View>
      {selected ? <Check size={18} strokeWidth={2.5} color={colors.accentInk} /> : chevron ? <ChevronRight size={18} strokeWidth={1.75} color={colors.inkSoft} /> : null}
    </Pressable>
  );
}

/** Konu seçimi: Karışık · ders · dersin konusu. Yeterli soru yoksa sunucu maçı kurmaz ve nedenini söyler. */
export function DuelScopeSheet({ visible, onClose, moduleId, value, onPick }: { visible: boolean; onClose: () => void; moduleId: string | null; value: PickedScope; onPick: (s: PickedScope) => void }) {
  const { colors, space } = useTheme();
  const [course, setCourse] = useState<{ id: string; name: string } | null>(null);
  const courses = useCourses(visible ? moduleId : null);
  const topics = useCourseTopics(visible && course ? course.id : null);
  const pick = (s: PickedScope) => {
    onPick(s);
    setCourse(null);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={course ? course.name : "Konu seç"}>
      {course ? (
        <>
          <Pressable accessibilityRole="button" onPress={() => setCourse(null)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.s1 }}>
            <ChevronLeft size={18} strokeWidth={1.75} color={colors.accentInk} />
            <AppText variant="subhead" tone="accent">
              Dersler
            </AppText>
          </Pressable>
          <ScopeRow icon="book" title="Dersin tamamı" selected={value.kind === "course" && value.id === course.id} onPress={() => pick({ kind: "course", id: course.id, label: course.name })} />
          {topics.isPending ? <Skeleton height={56} /> : null}
          {(topics.data?.topics ?? []).map((t) => (
            <ScopeRow key={t.id} title={t.name} selected={value.kind === "topic" && value.id === t.id} onPress={() => pick({ kind: "topic", id: t.id, label: t.name })} />
          ))}
        </>
      ) : (
        <>
          <AppText variant="bodySm" tone="soft">
            Rakibin de aynı seçimi yapmış olmalı; dar konuda eşleşme uzayabilir.
          </AppText>
          <ScopeRow icon="mix" title="Karışık" note="Sınavının bütün dersleri · en hızlı eşleşme" selected={value.kind === "mixed"} onPress={() => pick(MIXED_SCOPE)} />
          <AppText variant="label" tone="subtle">
            Derse göre
          </AppText>
          {courses.isPending && moduleId ? <Skeleton height={56} /> : null}
          {(courses.data ?? []).map((c) => (
            <ScopeRow key={c.id} icon="book" title={c.name} note={value.kind !== "mixed" && (value.id === c.id || value.label === c.name) ? "Seçili" : undefined} chevron onPress={() => setCourse({ id: c.id, name: c.name })} />
          ))}
        </>
      )}
    </Sheet>
  );
}

/** Kodla oyna: kod üret (bekleme ekranına geçer) ya da gelen kodu gir. Salon kodu da buradan girilir. */
export function DuelCodeSheet({ visible, onClose, onDismissed, onCreate, onJoin, creating, joining, error, mode }: { visible: boolean; onClose: () => void; onDismissed?: () => void; onCreate?: () => void; onJoin: (code: string) => void; creating?: boolean; joining?: boolean; error?: string | null; mode: "duel" | "room" }) {
  const { colors, space } = useTheme();
  const [code, setCode] = useState("");
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (
    <Sheet visible={visible} onClose={onClose} onDismissed={onDismissed} title={mode === "duel" ? "Kodla oyna" : "Kodla katıl"}>
      {onCreate ? (
        <>
          <AppText variant="bodySm" tone="soft">
            Kod üret, arkadaşına gönder; girdiği an maç başlar. Kod 10 dakika geçerli ve tek kullanımlıktır.
          </AppText>
          <Button title="Kod üret" loading={creating} onPress={onCreate} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
            <AppText variant="bodySm" tone="subtle">
              ya da
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
          </View>
        </>
      ) : null}
      <TextField label={mode === "duel" ? "Sana kod geldiyse" : "Başkanın paylaştığı kod"} placeholder="Örn. S4KD9P" autoCapitalize="characters" autoCorrect={false} maxLength={9} value={code} onChangeText={setCode} error={error} returnKeyType="go" onSubmitEditing={() => clean.length === 6 && onJoin(clean)} />
      <Button title="Katıl" variant="secondary" disabled={clean.length !== 6} loading={joining} onPress={() => onJoin(clean)} />
    </Sheet>
  );
}

/**
 * Oyuncu çağır. `roomId` verilirse salona davet, verilmezse `scope` ile 1'e 1 davet.
 * Arama en az iki harfle; boşken çevrimiçi olanlar listelenir. Bekleyen davet satırda geri sayar.
 */
export function DuelInviteSheet({ visible, onClose, scope, roomId }: { visible: boolean; onClose: () => void; scope: DuelScope; roomId?: string }) {
  const { space } = useTheme();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const list = useDuelPlayers(term, visible);
  const friends = useDuelFriends(visible);
  const hub = useDuelHub(visible);
  const act = useDuelActions();
  const now = useNow(1000, visible);
  const outgoing = hub.data?.invitations.outgoing ?? [];
  const busy = act.invite.isPending || act.inviteToRoom.isPending;
  const onError = (e: Error) => setHata(e.message);
  const call = (userId: string) => {
    setHata(null);
    if (roomId) act.inviteToRoom.mutate({ id: roomId, userId }, { onError });
    else act.invite.mutate({ toUserId: userId, scope }, { onError });
  };
  const row = (p: DuelPlayerRowData, i: number) => {
    const bekleyen = outgoing.find((d) => d.userId === p.userId);
    const kalan = bekleyen ? Date.parse(bekleyen.expiresAt) - now : 0;
    const davetli = !!bekleyen && kalan > 0;
    const durum = p.inMatch ? "Şu an maçta" : `${p.online ? "Çevrimiçi" : "Çevrimdışı · bildirim gider"} · Lig ${p.rating.toLocaleString("tr-TR")}`;
    return (
      <DuelPlayerRow
        key={p.userId}
        divider={i > 0}
        name={p.name}
        avatarUrl={p.avatarUrl}
        online={p.online}
        noteTone={davetli ? "accent" : "soft"}
        note={davetli ? `Davet gönderildi · ${mmss(kalan)}` : p.friend === "sent" ? `${durum} · istek gönderildi` : durum}
        action={
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s1 }}>
            {p.friend === "none" ? <IconButton icon={UserPlus} label={`${p.name} arkadaş olarak ekle`} variant="ghost" onPress={() => act.friendRequest.mutate(p.userId, { onError })} /> : null}
            {davetli ? (
              <Button title="Geri al" size="sm" variant="ghost" onPress={() => act.cancelInvite.mutate(bekleyen.id)} />
            ) : (
              <Button title="Çağır" size="sm" variant={p.online ? "primary" : "secondary"} disabled={busy || p.inMatch} onPress={() => call(p.userId)} />
            )}
          </View>
        }
      />
    );
  };
  const items = list.data?.items ?? [];
  const incoming = friends.data?.incoming ?? [];
  const dostlar = friends.data?.friends ?? [];
  return (
    <Sheet visible={visible} onClose={onClose} title={roomId ? "Salona çağır" : "Arkadaşını çağır"}>
      <TextField label="Ada göre ara" placeholder="En az iki harf" value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" />
      {hata ? <Notice tone="error">{hata}</Notice> : null}
      {!term && incoming.length > 0 ? (
        <>
          <AppText variant="label" tone="subtle">
            Arkadaşlık istekleri
          </AppText>
          <Card style={{ padding: 0, gap: 0 }}>
            {incoming.map((p, i) => (
              <DuelPlayerRow
                key={p.userId}
                divider={i > 0}
                name={p.name}
                avatarUrl={p.avatarUrl}
                online={p.online}
                note="Arkadaşlık isteği"
                action={
                  <View style={{ flexDirection: "row", gap: space.s1 }}>
                    <Button title="Reddet" size="sm" variant="ghost" onPress={() => act.friendRespond.mutate({ userId: p.userId, accept: false })} />
                    <Button title="Kabul et" size="sm" onPress={() => act.friendRespond.mutate({ userId: p.userId, accept: true }, { onError })} />
                  </View>
                }
              />
            ))}
          </Card>
        </>
      ) : null}
      {!term && dostlar.length > 0 ? (
        <>
          <AppText variant="label" tone="subtle">
            Arkadaşların
          </AppText>
          <Card style={{ padding: 0, gap: 0 }}>{dostlar.map(row)}</Card>
        </>
      ) : null}
      {!term ? (
        <AppText variant="label" tone="subtle">
          Şu an çevrimiçi
        </AppText>
      ) : null}
      {term.length === 1 ? (
        <AppText variant="bodySm" tone="soft">
          Aramak için en az iki harf yaz.
        </AppText>
      ) : list.isPending ? (
        <Skeleton height={64} radiusKey="card" />
      ) : items.length === 0 ? (
        <AppText variant="bodySm" tone="soft">
          {term ? "Bu adla kendi sınavından kimse bulunamadı." : "Şu an çevrimiçi kimse yok. Adını yazarak arayabilirsin; çevrimdışıysa davet bildirim olarak gider."}
        </AppText>
      ) : (
        <Card style={{ padding: 0, gap: 0 }}>{items.filter((p) => term || p.friend !== "friend").map(row)}</Card>
      )}
      <AppText variant="bodySm" tone="subtle">
        Yalnız kendi sınavının, düelloyu açmış adayları çıkar. Aynı kişiye bekleyen ikinci davet gönderilmez.
      </AppText>
    </Sheet>
  );
}
