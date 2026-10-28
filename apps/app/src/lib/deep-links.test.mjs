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
});

test("bildirim evrensel bağlantısı", () => {
  assert.equal(routeFromUrl("https://www.paemisyon.com/bildirim?git=leaderboard"), "leaderboard");
  assert.equal(routeFromUrl("https://paemisyon.com/bildirim"), "");
  assert.equal(routeFromUrl("https://evil.com/bildirim?git=x"), null);
  assert.equal(routeFromUrl("https://paemisyon.com/bugun"), null);
});
