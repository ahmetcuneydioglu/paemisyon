import { AppText, Screen } from "@/components/ui";

/** Kütüphane — F1 yer tutucu; içerik F4’te tasarım sistemiyle gelir. */
export default function KutuphaneScreen() {
  return (
    <Screen>
      <AppText variant="title">Kütüphane</AppText>
      <AppText variant="bodySm" tone="soft">
        Dersler, mevzuat, yanlışlar ve favoriler F4’te.
      </AppText>
    </Screen>
  );
}
