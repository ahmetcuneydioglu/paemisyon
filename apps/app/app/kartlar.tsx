import { useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ellipsis } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashcardDeck, FlashcardResultPanel, RatingBar, ReportSheet, SessionTopRow, UndoStrip } from "@/components/domain";
import { ArticlePeekSheet } from "@/components/domain/summary";
import { AppText, Button, IconButton, ListRow, Notice, ProgressBar, Sheet, Skeleton } from "@/components/ui";
import { FLASHCARD_MODE, flashcardKeys, flashcardsApi, sessionLine, type Flashcard, type FlashcardMode, type FlashcardRating, type FlashcardSession, type FlashcardSessionSummary, type FlashcardSource } from "@/features/flashcards/queries";
import { markSwipeHintSeen, useSwipeHintSeen } from "@/lib/swipe-hint-seen";
import { homeKeys } from "@/features/home/queries";
import { roomKeys } from "@/features/rooms/queries";
import { ApiError, NetworkError } from "@/lib/api";
import { dropQueuedFlashcardEvent, enqueueFlashcardEvent, flushFlashcardQueue } from "@/lib/offline-flashcards";
import { useTheme } from "@/theme/ThemeProvider";

/** Saat erişimi render dışında (React Compiler kuralı); yalnız olay işleyicileri çağırır. */
const saat = { simdi: () => Date.now() };
/** Geri al şeridi süresi; sunucu penceresi daha uzun (10 dk), istemci 5 sn gösterir. */
const GERI_AL_MS = 5000;
/** Oturum içi tekrar: "Tekrar" denen kart kuyruğun sonuna döner, turda en çok bu kadar görünür (sunucuyla aynı). */
const OTURUM_ICI_TEKRAR_EN_COK = 2;

type Phase = "loading" | "error" | "playing" | "finishing" | "done";
type SonOlay = { clientEventId: string; rating: FlashcardRating; cardId: string; index: number; requeued: boolean; at: number };

/**
 * Bilgi kartı oynatıcısı (Doc 56 aşama 4; Figma 159:1166 / 161:952 / 161:1019). Kök Stack'te tam
 * ekran modal. Kuyruk sunucudan tek seferde gelir; puanlar arka planda gider (çevrimdışıysa
 * kuyruğa, kimliği istemcide üretilir: aynı puan iki kez gitse de sunucu birini sayar). "Tekrar"
 * denen kart turun sonuna döner. Geri al 5 sn. Bitişte oturum özeti aynı ekranda.
 * Params: courseId | topicId | unitSlug, mode, resume=1, source, title.
 */
export default function KartlarScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { height: ekranYuksekligi } = useWindowDimensions();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ courseId?: string; topicId?: string; unitSlug?: string; mode?: string; resume?: string; source?: string; title?: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [premiumGate, setPremiumGate] = useState(false);
  const [session, setSession] = useState<FlashcardSession | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState<FlashcardRating | null>(null);
  const [sonOlay, setSonOlay] = useState<SonOlay | null>(null);
  const [tally, setTally] = useState({ known: 0, again: 0, learned: 0 });
  const [queuedNote, setQueuedNote] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [peek, setPeek] = useState<{ no: string; slug: string } | null>(null);
  // Hata bildir (Doc 56 §3f): kart üstündeki bayrak; sayfa açılır, tur ve kart yerinde kalır.
  const [reportOpen, setReportOpen] = useState(false);
  const [result, setResult] = useState<FlashcardSessionSummary | null>(null);
  const shownAt = useRef(0);
  // Yoldaki puan istekleri: bitiş onları bekler (son kartın puanı complete'ten önce varsın).
  const yolda = useRef(new Set<Promise<unknown>>());
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scope = { courseId: p.courseId || undefined, topicId: p.topicId || undefined, unitSlug: p.unitSlug || undefined };
  const mode = (p.mode as FlashcardMode | undefined) ?? "all";
  const source = (p.source as FlashcardSource | undefined) ?? undefined;
  const total = cards.length;
  const card = cards[index] ?? null;
  const next = cards[index + 1] ?? null;
  const label = session?.scope.label ?? p.title ?? "Bilgi kartları";
  // İlk giriş ipucu (Doc 56 §3e): bayrak okunmuş ve görülmemişse ilk kartta salınım; bir kez oynayınca kalıcı işaret.
  const swipeHintSeen = useSwipeHintSeen();
  const teaser = swipeHintSeen === false && index === 0 && card != null && pending == null;

  /* ---------------- Başlatma ---------------- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let s: FlashcardSession | null;
        if (p.resume === "1") {
          s = await flashcardsApi.resume();
          if (!s) throw new ApiError(404, "NO_SESSION", "Sürdürülecek oturum yok.");
        } else {
          s = await flashcardsApi.start({ scope, mode, ...(source ? { source } : {}) });
        }
        if (!active) return;
        setSession(s);
        setCards(s.cards);
        setIndex(0);
        shownAt.current = saat.simdi();
        setPhase("playing");
      } catch (e) {
        if (!active) return;
        if (e instanceof ApiError && (e.code === "PREMIUM_REQUIRED" || e.code === "DAILY_LIMIT_REACHED")) setPremiumGate(true);
        setError(baslatmaHatasi(e));
        setPhase("error");
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.courseId, p.topicId, p.unitSlug, p.mode, p.resume]);

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  /* ---------------- Puanlama ---------------- */
  function puanla(rating: FlashcardRating) {
    if (!card || pending || phase !== "playing") return;
    setPending(rating);
  }

  /** Deste kartı uçurduktan sonra: olay yazılır, kuyruk ve sayaçlar güncellenir, sonraki karta geçilir. */
  function kaydet(rating: FlashcardRating) {
    if (!session || !card) return;
    const clientEventId = Crypto.randomUUID();
    const spent = Math.max(0, saat.simdi() - shownAt.current);
    const onceki = card.state.state;
    void Haptics.notificationAsync(rating === "again" ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);

    // Oturum içi tekrar (sunucuyla aynı kural): kart turun sonuna döner, en çok 2 görünüm.
    const gorunme = cards.filter((c) => c.id === card.id).length;
    const requeued = rating === "again" && gorunme < OTURUM_ICI_TEKRAR_EN_COK;
    const yeniKartlar = requeued ? [...cards, card] : cards;
    setCards(yeniKartlar);
    setTally((t) => ({ ...t, known: t.known + (rating === "again" ? 0 : 1), again: t.again + (rating === "again" ? 1 : 0) }));
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setSonOlay({ clientEventId, rating, cardId: card.id, index, requeued, at: saat.simdi() });
    undoTimer.current = setTimeout(() => setSonOlay(null), GERI_AL_MS);

    setPending(null);
    setFlipped(false);
    shownAt.current = saat.simdi();

    const istek = flashcardsApi
      .event(session.sessionId, { clientEventId, flashcardId: card.id, rating, timeSpentMs: spent })
      .then((r) => {
        setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, state: r.state } : c)));
        if (r.state.state === "learned" && onceki !== "learned") setTally((t) => ({ ...t, learned: t.learned + 1 }));
      })
      .catch((e) => {
        if (e instanceof NetworkError) {
          void enqueueFlashcardEvent({ sessionId: session.sessionId, clientEventId, flashcardId: card.id, rating, timeSpentMs: spent });
          setQueuedNote(true);
        }
        // Sunucu reddi (bitmiş oturum vb.) sessiz: kullanıcı kartla ilerledi, sonuç bitişte netleşir.
      })
      .finally(() => yolda.current.delete(istek));
    yolda.current.add(istek);
    // Son kart: istek yola çıktıktan SONRA bitir; `bitir` yoldakileri bekler (aksi hâlde 409 SESSION_COMPLETED).
    if (index + 1 >= yeniKartlar.length) void bitir(session.sessionId);
    else setIndex(index + 1);
  }

  async function geriAl() {
    if (!session || !sonOlay) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const o = sonOlay;
    setSonOlay(null);
    try {
      // Henüz gitmediyse kuyruktan düşer; gittiyse sunucuda geri alınır (yalnız son olay, 10 dk).
      const dusuruldu = await dropQueuedFlashcardEvent(o.clientEventId);
      if (!dusuruldu) await flashcardsApi.undo(session.sessionId, o.clientEventId);
    } catch (e) {
      Alert.alert("Geri alınamadı", e instanceof ApiError && e.code === "UNDO_NOT_LATEST" ? "Bu kart için daha yeni bir puanın var." : e instanceof Error ? e.message : "Yeniden dene.");
      return;
    }
    setCards((cs) => (o.requeued ? cs.slice(0, -1) : cs));
    setTally((t) => ({ ...t, known: t.known - (o.rating === "again" ? 0 : 1), again: t.again - (o.rating === "again" ? 1 : 0) }));
    setIndex(o.index);
    setFlipped(false);
    shownAt.current = saat.simdi();
    void Haptics.selectionAsync();
  }

  /* ---------------- Bitiş ---------------- */
  async function bitir(sessionId: string) {
    setPhase("finishing");
    try {
      await Promise.allSettled([...yolda.current]);
      const q = await flushFlashcardQueue();
      if (q.stoppedByNetwork) setQueuedNote(true);
      const r = await flashcardsApi.complete(sessionId);
      setResult(r);
      setPhase("done");
      void qc.invalidateQueries({ queryKey: roomKeys.all });
      void qc.invalidateQueries({ queryKey: flashcardKeys.all });
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
    } catch (e) {
      setError(e instanceof NetworkError ? "Bağlantı yok; puanların cihazda saklandı, bağlantı gelince gönderilir." : e instanceof Error ? e.message : "Oturum bitirilemedi.");
      setPhase("error");
    }
  }

  // İlerlemeyi sıfırla (Doc 56 §3g): onay → sunucu kapsamdaki SRS durumunu siler (favoriler ve geçmiş kalır)
  // → aynı kapsamda "Tüm kartlar" turu baştan açılır (sıfırlanınca her kart yenidir; "vade" modu boş kalırdı).
  function sifirlamayiSor() {
    setMenuOpen(false);
    Alert.alert("Bilgi kartlarını sıfırla", `${label} için öğrenildi ve tekrar ilerlemesi sıfırlanacak. Favoriler ve puanlama geçmişin korunur. Devam edilsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sıfırla", style: "destructive", onPress: () => void sifirla() },
    ]);
  }
  async function sifirla() {
    setPhase("loading");
    try {
      await flashcardsApi.resetProgress(scope);
      void qc.invalidateQueries({ queryKey: flashcardKeys.all });
      void qc.invalidateQueries({ queryKey: roomKeys.all });
      const s = await flashcardsApi.start({ scope, mode: "all", ...(source ? { source } : {}) });
      setSession(s);
      setCards(s.cards);
      setIndex(0);
      setFlipped(false);
      setPending(null);
      setSonOlay(null);
      setTally({ known: 0, again: 0, learned: 0 });
      setResult(null);
      shownAt.current = saat.simdi();
      setPhase("playing");
    } catch (e) {
      setError(baslatmaHatasi(e));
      setPhase("error");
    }
  }

  function leave() {
    void qc.invalidateQueries({ queryKey: roomKeys.all });
    void qc.invalidateQueries({ queryKey: flashcardKeys.all });
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/kutuphane");
  }

  function confirmExit() {
    if (phase !== "playing" || tally.known + tally.again === 0) {
      leave();
      return;
    }
    Alert.alert("Turdan çık?", "Puanladığın kartlar kaydedildi; kalan kartlara kaldığın yerden dönebilirsin.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çık", style: "destructive", onPress: leave },
    ]);
  }

  /* ---------------- Araçlar ---------------- */
  function toggleBookmark() {
    if (!card) return;
    const on = !card.bookmarked;
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, bookmarked: on } : c)));
    flashcardsApi
      .setBookmark(card.id, on)
      .then(() => void qc.invalidateQueries({ queryKey: flashcardKeys.bookmarks }))
      .catch(() => setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, bookmarked: !on } : c))));
  }

  function soruCoz(c: Flashcard) {
    const articleNos = c.articles.map((a) => a.no);
    router.replace({
      pathname: "/seans",
      params: { mode: "practice", source: "flashcards", count: "10", focusKind: "topic", topicId: c.topic.id, courseId: "", recipe: "", ...(articleNos.length ? { articleNos: articleNos.join(","), title: c.unit?.title ?? c.topic.name } : {}) },
    });
  }

  function tekrariSur() {
    setPhase("loading");
    setResult(null);
    setTally({ known: 0, again: 0, learned: 0 });
    setSonOlay(null);
    router.setParams({ mode: "due", resume: "" });
  }

  /* ---------------- Yerleşim ---------------- */
  // Kart yüksekliği: üst satır, ilerleme, puan çubuğu, sayaç ve güvenli alanlar düşülür; 360–460 arası.
  const kartYuksekligi = Math.max(340, Math.min(460, ekranYuksekligi - insets.top - insets.bottom - 44 - 36 - 54 - 28 - space.s4 * 5));
  const altLabel = `${FLASHCARD_MODE[session?.mode ?? mode].title} · ${Math.min(index + 1, Math.max(total, 1))} / ${total}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <SessionTopRow onClose={phase === "done" ? leave : confirmExit} closeLabel="Kartlardan çık" label={label} right={phase === "playing" ? <IconButton icon={Ellipsis} label="Kart menüsü" variant="ghost" onPress={() => setMenuOpen(true)} /> : null} />

      {phase === "loading" || phase === "finishing" ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={6} radiusKey="pill" />
          <Skeleton height={kartYuksekligi} radiusKey="card" />
          <Skeleton height={54} radiusKey="card" />
          <AppText variant="bodySm" tone="soft">
            {phase === "finishing" ? "Oturum bitiriliyor…" : "Kartlar geliyor…"}
          </AppText>
        </View>
      ) : phase === "error" ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Notice tone={premiumGate ? "warning" : "error"} title={premiumGate ? (error?.includes("hakkın doldu") ? "Bugünlük hak doldu" : "Premium gerekiyor") : "Kartlar açılamadı"}>
            {error}
          </Notice>
          {premiumGate ? <Button title="Premium'u gör" onPress={() => router.replace("/paywall")} /> : null}
          <Button title="Geri dön" variant="secondary" onPress={leave} />
        </View>
      ) : phase === "done" && result ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingBottom: insets.bottom + space.s8, gap: space.s5 }} contentInsetAdjustmentBehavior="never">
          {queuedNote ? <Notice tone="info">Bazı puanlar çevrimdışı kaydedildi; bağlantı gelince gönderilir, özet o zaman güncellenir.</Notice> : null}
          <FlashcardResultPanel result={result} line={sessionLine(result)} learnedDelta={tally.learned} />
          <View style={{ gap: space.s2 }}>
            <Button title="Geldiğin yere dön" onPress={leave} />
            {result.due.count > 0 ? <Button title={`Tekrarı sür · ${Math.min(20, result.due.count)} kart`} variant="secondary" onPress={tekrariSur} /> : null}
            {scope.topicId || cards[0] ? <Button title="Bu konudan 10 soru çöz" variant="ghost" onPress={() => cards[0] && soruCoz(cards[0])} /> : null}
          </View>
        </ScrollView>
      ) : card ? (
        <View style={{ flex: 1, paddingHorizontal: space.screenGutter, gap: space.s4, paddingTop: space.s1 }}>
          <View style={{ gap: space.s2 }}>
            <ProgressBar value={total > 0 ? index / total : 0} height={4} label="Tur ilerlemesi" />
            <AppText variant="bodySm" tone="soft" style={{ textAlign: "center", fontVariant: ["tabular-nums"] }}>
              {altLabel}
            </AppText>
          </View>
          {queuedNote ? <Notice tone="info">Çevrimdışısın; puanların cihazda saklanıyor, bağlantı gelince gönderilecek.</Notice> : null}
          <FlashcardDeck
            card={card}
            next={next}
            flipped={flipped}
            onFlip={() => {
              void Haptics.selectionAsync();
              setFlipped((f) => !f);
            }}
            pending={pending}
            onRate={kaydet}
            height={kartYuksekligi}
            onBookmark={toggleBookmark}
            onReport={() => setReportOpen(true)}
            onArticle={(no, slug) => slug && setPeek({ no, slug })}
            onSolve={() => soruCoz(card)}
            teaser={teaser}
            onTeaserEnd={markSwipeHintSeen}
          />
          <RatingBar onAgain={() => puanla("again")} onKnown={() => puanla("known")} disabled={pending != null} />
          {sonOlay ? (
            <UndoStrip rating={sonOlay.rating} onUndo={() => void geriAl()} />
          ) : (
            <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center" }}>
              {tally.known + tally.again === 0 ? "Sağa kaydır: biliyorum · sola kaydır: tekrar" : `Bu tur · ${tally.known} biliyorum · ${tally.again} tekrar`}
            </AppText>
          )}
        </View>
      ) : null}

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Kartlar">
        <ListRow title="Şimdilik bitir" subtitle="Puanladıkların kaydedilir, özet gösterilir" chevron={false} onPress={() => { setMenuOpen(false); if (session) void bitir(session.sessionId); }} />
        <ListRow title="Turdan çık" subtitle="Kalan kartlara kaldığın yerden dönersin" chevron={false} onPress={() => { setMenuOpen(false); leave(); }} />
        <ListRow title="İlerlemeyi sıfırla" subtitle={`${label}: öğrenildi ve tekrar durumu silinir, favoriler korunur`} chevron={false} divider={false} onPress={sifirlamayiSor} />
        <Button title="Vazgeç" variant="secondary" onPress={() => setMenuOpen(false)} />
      </Sheet>

      {card ? <ReportSheet target={{ kind: "flashcard", id: card.id }} visible={reportOpen} onClose={() => setReportOpen(false)} /> : null}
      <ArticlePeekSheet lawSlug={peek?.slug ?? ""} no={peek?.no ?? null} title={null} onClose={() => setPeek(null)} onReadFull={(no) => { const slug = peek?.slug; setPeek(null); if (slug) router.push({ pathname: "/oku/[slug]", params: { slug, madde: no } }); }} />
    </View>
  );
}

function baslatmaHatasi(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case "PREMIUM_REQUIRED": return "Bu kapsamın bilgi kartları Premium ile açılır.";
      case "DAILY_LIMIT_REACHED": return e.message || "Bugünlük kart hakkın doldu; yarın devam edebilirsin. Premium ile sınırsız.";
      case "NO_CARDS": return "Bu modda çalışılacak kart yok.";
      case "FLASHCARDS_DISABLED": return "Bilgi kartları henüz açık değil.";
      case "NO_SESSION": return "Sürdürülecek oturum yok.";
      default: return e.message;
    }
  }
  if (e instanceof NetworkError) return "Bağlantı yok; kartlar açılamadı.";
  return "Kartlar açılamadı.";
}
