import assert from "node:assert/strict";
import { test } from "node:test";
import { routeFromUrl, routeToHref } from "./deep-links.ts";

test("push route sözlüğü", () => {
  assert.equal(routeToHref("daily-quiz").pathname, "/seans");
  assert.equal(routeToHref("daily-quiz").params?.mode, "daily");
  assert.equal(routeToHref("denemeler").pathname, "/(tabs)/denemeler");
  assert.equal(routeToHref("leaderboard").pathname, "/(tabs)/ben/liderlik");
  const q = routeToHref("question:4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(q.pathname, "/seans");
  assert.equal(q.params?.questionId, "4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(routeToHref("question:bozuk").pathname, "/(tabs)");
  assert.equal(routeToHref("").pathname, "/(tabs)");
  assert.equal(routeToHref(undefined).pathname, "/(tabs)");
  assert.equal(routeToHref("/denemeler/4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b").params?.exam, "4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(routeToHref("/review").pathname, "/(tabs)/kutuphane/tekrar");
  const sonuc = routeToHref("deneme-sonuc/4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(sonuc.pathname, "/deneme-sonuc/[attemptId]");
  assert.equal(sonuc.params?.attemptId, "4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(routeToHref("deneme-sonuc/bozuk").pathname, "/(tabs)");
  // Bilgi kartları (Doc 56)
  assert.equal(routeToHref("/kartlar").pathname, "/kartlar");
  assert.equal(routeToHref("/kartlar").params?.mode, "due");
  const kart = routeToHref("flashcards:4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(kart.pathname, "/kartlar");
  assert.equal(kart.params?.topicId, "4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(routeToHref("flashcards:bozuk").pathname, "/(tabs)");
  // Koç kartı / bildirim: sorgulu adres aynen taşınır, mod doğrulanır.
  const kocKarti = routeToHref("/kartlar?mode=due");
  assert.equal(kocKarti.pathname, "/kartlar");
  assert.equal(kocKarti.params?.mode, "due");
  const konu = routeToHref("/kartlar?mode=new&topicId=4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b&source=home_route");
  assert.equal(konu.params?.mode, "new");
  assert.equal(konu.params?.topicId, "4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  assert.equal(konu.params?.source, "home_route");
  assert.equal(routeToHref("/kartlar?mode=bozuk").params?.mode, "due");
  assert.equal(routeToHref("flashcards").params?.mode, "due");
});

test("bildirim evrensel bağlantısı", () => {
  assert.equal(routeFromUrl("https://www.paemisyon.com/bildirim?git=leaderboard"), "leaderboard");
  assert.equal(routeFromUrl("https://paemisyon.com/bildirim"), "");
  assert.equal(routeFromUrl("https://evil.com/bildirim?git=x"), null);
  assert.equal(routeFromUrl("https://paemisyon.com/bugun"), null);
});
