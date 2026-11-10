import { useWindowDimensions } from "react-native";

/**
 * Dinamik yazı (iOS Dynamic Type / Android yazı boyutu) için iki ortak karar — tek tek bileşende
 * sayı uydurulmaz:
 *
 * - `COMPACT_TEXT_SCALE`: yan yana dizilmek ZORUNDA olan sıkışık parçaların (7 günlük çizelge
 *   etiketi, sıra numarası, satır sonu sayı) yazı tavanı. Metnin kendisi (ad, cümle) bu tavana
 *   girmez; o, yerleşim dikeye dönerek büyür.
 * - `useLargeText()`: yazı ölçeği bu eşiği aşınca yan yana iki bloklu satırlar alt alta dizilir
 *   (geri sayım + "bu hafta", haftalık özet + rütbe). Large (1,0) ve bir üstü yan yana kalır;
 *   XXXL ve erişilebilirlik boyları (AX1–AX5) dikeye geçer.
 */
export const COMPACT_TEXT_SCALE = 1.3;
export const LARGE_TEXT_THRESHOLD = 1.3;

export function useLargeText(): boolean {
  const { fontScale } = useWindowDimensions();
  return fontScale > LARGE_TEXT_THRESHOLD;
}
