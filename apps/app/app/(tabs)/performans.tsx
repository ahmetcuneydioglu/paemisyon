import { AppText, Screen } from "@/components/ui";

/** Performans — F1 yer tutucu; içerik F4’te tasarım sistemiyle gelir. */
export default function PerformansScreen() {
  return (
    <Screen>
      <AppText variant="title">Performans</AppText>
      <AppText variant="bodySm" tone="soft">
        Genel bakış, konu haritası ve haftalık rapor F4’te.
      </AppText>
    </Screen>
  );
}
