import { AlertTriangle, BookOpen, Lightbulb, Scale } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Card, ListRow } from "@/components/ui";
import { QuestionOption, QuestionStem } from "@/components/domain/question";
import { SummaryBody } from "@/components/domain/summary";
import type { LessonBlock } from "@/features/lessons/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Ders gövdesi blokları (Doc 57; kullanıcı kararı 7 Kas 2026: altı tür). Metin, karşılaştırma tablosu,
 * tanım kartı, uyarı (tek ton), örnek, madde bağı (resmî metin sheet'te) ve "Sınavda çıktı" sorusu.
 * Kaynak etiketi hiçbir blokta yok. `onArticle` verilmezse madde satırı dokunulmaz çizilir.
 */
export function LessonContent({ blocks, onArticle }: { blocks: readonly LessonBlock[]; onArticle?: (law: string, no: string) => void }) {
  const { colors, space } = useTheme();
  return (
    <View style={{ gap: space.s3 }}>
      {blocks.map((b, i) => {
        if (b.kind === "text") return <SummaryBody key={i} text={b.text} />;
        if (b.kind === "table") return <ComparisonTable key={i} headers={b.headers} rows={b.rows} />;
        if (b.kind === "tanim")
          return (
            <Card key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.accent }}>
              <AppText variant="label" tone="accentInk">Tanım</AppText>
              <AppText variant="subhead">{b.term}</AppText>
              <SummaryBody text={b.text} />
            </Card>
          );
        if (b.kind === "uyari")
          return (
            <Card key={i} tone="alt">
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
                <AlertTriangle size={16} color={colors.accentInk} strokeWidth={1.75} />
                <AppText variant="label" tone="accentInk">Dikkat</AppText>
              </View>
              <SummaryBody text={b.text} />
            </Card>
          );
        if (b.kind === "ornek")
          return (
            <Card key={i}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
                <Lightbulb size={16} color={colors.inkSoft} strokeWidth={1.75} />
                <AppText variant="label" tone="subtle">Örnek</AppText>
              </View>
              <SummaryBody text={b.text} />
            </Card>
          );
        if (b.kind === "madde")
          return (
            <Card key={i} style={{ paddingVertical: 0 }}>
              <ListRow
                title={`${b.lawName ?? b.law} md ${b.no}`}
                subtitle={b.note ?? "Resmî madde metnini aç"}
                leading={<Scale size={20} color={colors.ink} strokeWidth={1.75} />}
                divider={false}
                onPress={onArticle ? () => onArticle(b.law, b.no) : undefined}
              />
            </Card>
          );
        return <ExamQuestion key={i} block={b} />;
      })}
    </View>
  );
}

/**
 * Karşılaştırma tablosu. İki sütun yan yana; üç ve daha çok sütunda ilk sütun ölçüt etiketi olur ve
 * karşılaştırılan sütunlar telefonda alt alta dizilir (dört sütun yan yana sığmaz, kelimeler bölünür).
 */
function ComparisonTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const { colors, space } = useTheme();
  const stacked = headers.length >= 3;
  if (!stacked) {
    return (
      <Card style={{ padding: space.s4, gap: 0 }}>
        <View style={{ flexDirection: "row", gap: space.s3, paddingBottom: space.s3 }}>
          {headers.map((h, k) => <AppText key={k} variant="subhead" tone="accentInk" style={{ flex: 1 }}>{h}</AppText>)}
        </View>
        {rows.map((row, j) => (
          <View key={j} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: space.s3, flexDirection: "row", alignItems: "flex-start", gap: space.s3 }}>
            {row.map((cell, k) => (
              <View key={k} style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="bodySm">{cell}</AppText>
              </View>
            ))}
          </View>
        ))}
      </Card>
    );
  }
  const headings = headers.slice(1);
  return (
    <Card style={{ padding: space.s4, gap: 0 }}>
      {rows.map((row, j) => (
        <View key={j} style={{ borderTopWidth: j === 0 ? 0 : 1, borderTopColor: colors.line, paddingVertical: j === 0 ? 0 : space.s3, paddingBottom: space.s3, gap: space.s2 }}>
          <AppText variant="subhead">{row[0]}</AppText>
          {headings.map((h, k) => (
            <View key={k} style={{ flexDirection: "row", gap: space.s3, alignItems: "flex-start" }}>
              <AppText variant="label" tone="accentInk" style={{ width: 104 }}>{h}</AppText>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="bodySm">{row[k + 1] ?? ""}</AppText>
              </View>
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

/** "Sınavda çıktı": bankadaki gerçek soru; şık seçilince doğru/yanlış ve açıklama açılır. Kaynak etiketi yok. */
function ExamQuestion({ block: q }: { block: Extract<LessonBlock, { kind: "soru" }> }) {
  const { colors, space } = useTheme();
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked != null;
  const state = (id: string) => {
    if (!answered) return "default" as const;
    if (id === q.correctOptionId) return "correct" as const;
    if (id === picked) return "incorrect" as const;
    return "disabled" as const;
  };
  return (
    <Card style={{ gap: space.s3, borderColor: colors.accent, borderWidth: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <BookOpen size={16} color={colors.accentInk} strokeWidth={1.75} />
        <AppText variant="label" tone="accentInk">Sınavda çıktı</AppText>
      </View>
      <QuestionStem index={1} total={1} counter={false} stem={q.stem} />
      <View style={{ gap: space.s2 }}>
        {q.options.map((o) => (
          <QuestionOption key={o.id} label={o.label} text={o.text} state={state(o.id)} onPress={answered ? undefined : () => setPicked(o.id)} />
        ))}
      </View>
      {answered ? (
        <Card tone={picked === q.correctOptionId ? "accent" : "alt"}>
          <AppText variant="subhead">{picked === q.correctOptionId ? "Doğru" : `Yanlış · doğru cevap ${q.options.find((o) => o.id === q.correctOptionId)?.label ?? "—"}`}</AppText>
          {q.explanation ? <SummaryBody text={q.explanation} /> : null}
        </Card>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setPicked(q.correctOptionId ?? "")} hitSlop={8}>
          <AppText variant="bodySm" tone="accentInk">Cevabı göster</AppText>
        </Pressable>
      )}
    </Card>
  );
}
