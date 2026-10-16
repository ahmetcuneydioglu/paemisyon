import { AppText, Screen } from "@/components/ui";

/** Denemeler — F1 yer tutucu; içerik F4’te tasarım sistemiyle gelir. */
export default function DenemelerScreen() {
  return (
    <Screen>
      <AppText variant="title">Denemeler</AppText>
      <AppText variant="bodySm" tone="soft">
        Deneme takvimi, oynatıcı ve sonuçlar F4’te.
      </AppText>
    </Screen>
  );
}
