import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { CourseIcon } from "@/components/domain";
import { AppText, Badge, Button, ListRow, Notice, Sheet, Skeleton } from "@/components/ui";
import { useCourses, useCourseTopics, type CatalogCourse, type CatalogTopic } from "@/features/catalog/queries";
import { useTheme } from "@/theme/ThemeProvider";
import { useSetFocus, type DailyFocus, type FocusKind } from "./queries";

/**
 * Odak sheet'i (Doc 48/01 §7, O1–O4): odak bir AYARDIR, başlatıcı değil. Üç satır tek
 * anatomiyle (radyo). "Ders veya konu" aynı sheet içinde yığın olarak iner: dersler →
 * konular ("Dersin tamamı" ilk satır). Seçim PUT /me/focus ile sunucuya gider; CTA etiketi
 * brief'ten yeniden gelir (istemci etiket kurmaz). Başlatmadan kapatırsan odak gün boyu kalır.
 */
type Level = { kind: "root" } | { kind: "courses" } | { kind: "topics"; course: CatalogCourse };

export function FocusSheet({
  visible,
  onClose,
  focus,
  moduleId,
  unresolvedWrongCount,
  startLabel,
  onStart,
}: {
  visible: boolean;
  onClose: () => void;
  focus: DailyFocus | null;
  moduleId: string | null | undefined;
  unresolvedWrongCount: number;
  startLabel: string;
  onStart: () => void;
}) {
  const { colors, space } = useTheme();
  const [level, setLevel] = useState<Level>({ kind: "root" });
  const setFocus = useSetFocus();
  // Kapanınca köke döner; bir sonraki açılış hep kökten başlar (effect yerine olayda).
  const close = () => {
    setLevel({ kind: "root" });
    onClose();
  };

  const current: FocusKind = focus?.kind ?? "coach";
  const pick = (body: { kind: FocusKind; courseId?: string; topicId?: string }) => {
    setFocus.mutate(body, { onSuccess: () => setLevel({ kind: "root" }) });
  };

  const title = level.kind === "root" ? "Bugün neye odaklanalım?" : level.kind === "courses" ? "Ders seç" : level.course.name;

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={title}
      footer={level.kind === "root" ? <Button title={startLabel} onPress={onStart} loading={setFocus.isPending} /> : undefined}
    >
      {level.kind !== "root" ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => setLevel(level.kind === "topics" ? { kind: "courses" } : { kind: "root" })} style={{ flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 }}>
          <ChevronLeft color={colors.accentInk} size={18} strokeWidth={2} />
          <AppText variant="subhead" tone="accentInk">
            {level.kind === "topics" ? "Dersler" : "Odak"}
          </AppText>
        </Pressable>
      ) : null}

      {setFocus.isError ? <Notice tone="error">{setFocus.error.message}</Notice> : null}

      {level.kind === "root" ? (
        <>
          <AppText variant="bodySm" tone="soft">
            Konuyu sen seç, soruları koç seçsin.
          </AppText>
          <Radio
            title="Koç seçsin"
            subtitle="Zayıf konular, çözülmemiş yanlışlar ve yeni sorular dengeli karışır."
            badge="Önerilen"
            selected={current === "coach"}
            onPress={() => pick({ kind: "coach" })}
          />
          <Radio
            title="Ders veya konu"
            subtitle={current === "course" || current === "topic" ? (focus?.label ?? "Seçili") : "Seçmek için dokun"}
            selected={current === "course" || current === "topic"}
            onPress={() => setLevel({ kind: "courses" })}
            chevron
          />
          <Radio
            title="Yanlışlarım"
            subtitle={unresolvedWrongCount > 0 ? `${unresolvedWrongCount} çözülmemiş yanlış` : "Çözülmemiş yanlışın yok; önce bir tur çöz."}
            selected={current === "wrongs"}
            disabled={unresolvedWrongCount === 0}
            onPress={() => pick({ kind: "wrongs" })}
          />
          <AppText variant="bodySm" tone="subtle" style={{ paddingTop: space.s1 }}>
            Odak bugün için geçerli; yarın koça döner.
          </AppText>
        </>
      ) : level.kind === "courses" ? (
        <CourseList moduleId={moduleId} selectedCourseId={focus?.courseId ?? null} onPick={(c) => setLevel({ kind: "topics", course: c })} />
      ) : (
        <TopicList
          course={level.course}
          selectedTopicId={focus?.kind === "topic" ? focus.topicId : null}
          wholeSelected={focus?.kind === "course" && focus.courseId === level.course.id}
          onPickWhole={() => pick({ kind: "course", courseId: level.course.id })}
          onPickTopic={(t) => pick({ kind: "topic", topicId: t.id })}
        />
      )}
    </Sheet>
  );
}

function Radio({ title, subtitle, badge, badgeTone = "accent", selected, disabled, chevron, onPress }: { title: string; subtitle?: string; badge?: string; badgeTone?: "accent" | "neutral" | "warning"; selected: boolean; disabled?: boolean; chevron?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      onPress={disabled ? undefined : onPress}
      chevron={Boolean(chevron)}
      trailing={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
          {!chevron ? (
            <View accessibilityRole="radio" accessibilityState={{ selected, disabled }} style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? colors.accent : colors.line, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1 }}>
              {selected ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.accent }} /> : null}
            </View>
          ) : null}
        </View>
      }
    />
  );
}

function CourseList({ moduleId, selectedCourseId, onPick }: { moduleId: string | null | undefined; selectedCourseId: string | null; onPick: (c: CatalogCourse) => void }) {
  const { colors } = useTheme();
  const q = useCourses(moduleId);
  if (!moduleId) return <Notice tone="warning" title="Hedef sınav seçilmemiş">Ben › Hedef sınav’dan seç; dersler ona göre gelir.</Notice>;
  if (q.isPending) return <Skeleton height={120} radiusKey="card" />;
  if (q.isError) return <Notice tone="error">{q.error.message}</Notice>;
  return (
    <View>
      {q.data.map((c, i) => (
        <ListRow key={c.id} title={c.name} subtitle={c.sectionName !== c.name ? c.sectionName : `Sınavda %${c.weightPercent} ağırlık`} leading={<CourseIcon name={c.icon} color={colors.ink} size={20} />} onPress={() => onPick(c)} trailing={selectedCourseId === c.id ? <Badge tone="accent">Seçili</Badge> : null} divider={i < q.data.length - 1} />
      ))}
    </View>
  );
}

function TopicList({ course, selectedTopicId, wholeSelected, onPickWhole, onPickTopic }: { course: CatalogCourse; selectedTopicId: string | null; wholeSelected: boolean; onPickWhole: () => void; onPickTopic: (t: CatalogTopic) => void }) {
  const q = useCourseTopics(course.id);
  if (q.isPending) return <Skeleton height={160} radiusKey="card" />;
  if (q.isError) return <Notice tone="error">{q.error.message}</Notice>;
  const flat = q.data.topics.flatMap((t) => [t, ...t.children]);
  const sub = (t: CatalogTopic) => (t.mastery == null ? "Henüz çözülmedi" : `%${t.mastery} doğru · ${t.solvedCount} soru${t.weak ? " · zayıf" : ""}`);
  return (
    <View>
      <AppText variant="bodySm" tone="soft" style={{ paddingBottom: 4 }}>
        {q.data.summary.mastery == null ? "Henüz çözüm yok" : `%${q.data.summary.mastery} doğru · ${q.data.summary.solvedCount} soru`}
      </AppText>
      <Radio title="Dersin tamamı" subtitle="Karışık; koç konular arasında dengeler" selected={wholeSelected} onPress={onPickWhole} />
      {flat.map((t) => (
        // Premium konu: karar sunucuda (PREMIUM_REQUIRED); burada yalnız önceden söylenir, paywall F5.
        <Radio key={t.id} title={t.name} subtitle={sub(t)} badge={t.isPremium ? "Premium" : undefined} badgeTone="warning" selected={selectedTopicId === t.id} onPress={() => onPickTopic(t)} />
      ))}
    </View>
  );
}
