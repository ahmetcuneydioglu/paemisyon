import { Stack, useRouter } from "expo-router";
import { BellOff, Settings2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Linking, Platform, RefreshControl, SectionList, View } from "react-native";
import { NotificationRow } from "@/components/domain";
import { AppText, Button, Chip, EmptyState, IconButton, Notice, Skeleton } from "@/components/ui";
import { groupInbox, needsUpdate, recordNotificationEvent, useInbox, useReadAll, type InboxItem } from "@/features/notifications/queries";
import { routeToHref } from "@/lib/deep-links";
import { useStackOptions } from "@/navigation/stack-options";
import { useTheme } from "@/theme/ThemeProvider";

const STORE_URL = Platform.OS === "android" ? "https://play.google.com/store/apps/details?id=com.paemisyon.paemisyon" : "https://apps.apple.com/tr/app/paemisyon/id6802087692";

/**
 * Bildirimler (Doc 52 §9, Figma 51:5): Tümü · Okunmamış süzgeci, gün grupları (Bugün · Dün ·
 * Bu hafta · Daha önce), "Tümünü okundu say", aşağı kaydırınca imleçli devam. Görünen satır
 * okunmuş sayılmaz; okuma dokunuşla (`clicked` → readAt) ya da toplu düğmeyle. Hedefi bu
 * sürümün tanımadığı bildirim (`minAppVersion`) satırda "Güncelleme gerekli" taşır, dokununca
 * mağazaya yönlendirir. Kök yığında açılır; sekme çubuğu görünmez.
 */
export default function BildirimlerScreen() {
  const router = useRouter();
  const options = useStackOptions();
  const { colors, space } = useTheme();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const inbox = useInbox(unreadOnly);
  const readAll = useReadAll();

  const items = useMemo(() => inbox.data?.pages.flatMap((p) => p.items) ?? [], [inbox.data]);
  const unread = items.filter((i) => !i.readAt).length;
  const sections = useMemo(() => groupInbox(items).map((g) => ({ title: g.label, data: g.items })), [items]);

  const open = useCallback(
    (item: InboxItem) => {
      if (needsUpdate(item)) {
        Alert.alert("Güncelleme gerekli", "Bu bildirimin açtığı ekran uygulamanın yeni sürümünde. Mağazadan güncelleyip tekrar dene.", [
          { text: "Sonra" },
          { text: "Mağazayı aç", onPress: () => void Linking.openURL(STORE_URL) },
        ]);
        return;
      }
      void recordNotificationEvent(item.id, "clicked", "inbox");
      router.push(routeToHref(item.route) as never);
    },
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          ...options,
          title: "Bildirimler",
          headerRight: () => <IconButton icon={Settings2} label="Bildirim tercihleri" variant="ghost" onPress={() => router.push("/(tabs)/ben/ayarlar")} />,
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(it) => it.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: space.s8, gap: space.s2 }}
        refreshControl={<RefreshControl refreshing={inbox.isRefetching && !inbox.isFetchingNextPage} onRefresh={() => void inbox.refetch()} tintColor={colors.inkSubtle} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (inbox.hasNextPage && !inbox.isFetchingNextPage) void inbox.fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={{ gap: space.s3, paddingBottom: space.s2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2, flexWrap: "wrap" }}>
              <Chip label="Tümü" selected={!unreadOnly} onPress={() => setUnreadOnly(false)} />
              <Chip label={unread ? `Okunmamış · ${unread}` : "Okunmamış"} selected={unreadOnly} onPress={() => setUnreadOnly(true)} />
              <View style={{ flex: 1 }} />
              {unread > 0 ? <Button title="Tümünü okundu say" variant="ghost" size="sm" loading={readAll.isPending} onPress={() => readAll.mutate()} /> : null}
            </View>
            {inbox.isError ? (
              <Notice tone="error" title="Bildirimler alınamadı">
                {inbox.error.message}
              </Notice>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="label" tone="subtle" style={{ paddingTop: space.s3, paddingBottom: space.s1 }}>
            {section.title.toLocaleUpperCase("tr-TR")}
          </AppText>
        )}
        renderItem={({ item }) => <NotificationRow item={item} onPress={open} needsUpdate={needsUpdate(item)} />}
        ItemSeparatorComponent={() => <View style={{ height: space.s2 }} />}
        ListEmptyComponent={
          inbox.isPending ? (
            <View style={{ gap: space.s2 }}>
              <Skeleton height={72} radiusKey="card" />
              <Skeleton height={72} radiusKey="card" />
              <Skeleton height={72} radiusKey="card" />
            </View>
          ) : inbox.isError ? undefined : (
            <EmptyState
              icon={BellOff}
              title={unreadOnly ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
              body="Deneme sonuçların, günün sorusu ve hatırlatmaların burada birikir. Günde en fazla bir hatırlatma gönderiyoruz."
              action={<Button title="Bildirim tercihleri" variant="secondary" onPress={() => router.push("/(tabs)/ben/ayarlar")} />}
            />
          )
        }
        ListFooterComponent={
          inbox.isFetchingNextPage ? (
            <Skeleton height={72} radiusKey="card" />
          ) : items.length > 0 && !inbox.hasNextPage ? (
            <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center", paddingTop: space.s4 }}>
              Bildirimler 180 gün saklanır.
            </AppText>
          ) : undefined
        }
      />
    </View>
  );
}
