import { View } from "react-native";
import { AppText, Card } from "@/components/ui";
import { SummaryBody } from "./summary";
import { useTheme } from "@/theme/ThemeProvider";

type LessonBlock = { readonly kind: "text"; readonly text: string } | { readonly kind: "table"; readonly headers: readonly string[]; readonly rows: readonly (readonly string[])[] };

/** Üç sütunlu karşılaştırmada ölçüt satır başlığıdır; iki seçenek yan yana kalır. */
export function LessonContent({ blocks }: { blocks: readonly LessonBlock[] }) {
  const { colors, space } = useTheme();
  return <View style={{ gap: space.s3 }}>{blocks.map((b, i) => {
    if (b.kind === "text") return <SummaryBody key={i} text={b.text} />;
    const comparison = b.headers.length === 3;
    const headings = comparison ? b.headers.slice(1) : b.headers;
    return <Card key={i} style={{ padding: space.s4, gap: 0 }}>
      <View style={{ flexDirection: "row", gap: space.s3, paddingBottom: space.s3 }}>{headings.map((h, k) => <AppText key={k} variant="subhead" tone="accentInk" style={{ flex: 1 }}>{h}</AppText>)}</View>
      {b.rows.map((row, j) => <View key={j} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: space.s3, gap: space.s2 }}>
        {comparison ? <AppText variant="label" tone="subtle">{row[0]}</AppText> : null}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.s3 }}>{(comparison ? row.slice(1) : row).map((cell, k) => <View key={k} style={{ flex: 1, minWidth: 0 }}><AppText variant="bodySm">{cell}</AppText></View>)}</View>
      </View>)}
    </Card>;
  })}</View>;
}
