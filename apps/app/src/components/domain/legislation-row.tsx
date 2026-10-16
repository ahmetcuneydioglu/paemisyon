import { BookOpen } from "lucide-react-native";
import { ListRow } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Mevzuat satırı: "Kaldığın yer" ve madde listeleri. Kaynak ve doğrulama tarihi görünür
 * (Doc 29 §13); kısaltma + madde no üst satır, başlık alt satır.
 */
export function LegislationRow({ law, article, title, meta, onPress }: { law: string; article: string; title?: string | null; meta?: string | null; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <ListRow
      title={`${law} md. ${article}${title ? ` · ${title}` : ""}`}
      subtitle={meta ?? null}
      leading={<BookOpen color={colors.accent} size={20} strokeWidth={1.75} />}
      onPress={onPress}
    />
  );
}
