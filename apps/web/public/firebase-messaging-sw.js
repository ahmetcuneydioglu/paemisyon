/* eslint-disable no-undef */
/**
 * Web push service worker (FCM).
 *
 * Bilerek MİNİMUM: yalnız Firebase'i başlatır. Bildirimi gösterme ve tıklayınca
 * açma işini FCM'in kendisi yapar (sunucu `webpush.fcmOptions.link` gönderir).
 * Kendi `onBackgroundMessage` + `notificationclick` çiftimizi yazmak, payload'da
 * `notification` bloğu varken FCM'in otomatik gösterimiyle yarışıyor ve
 * tarayıcıya göre ya çift bildirim ya sessizlik üretiyor.
 *
 * Yapılandırma sorgu dizesinden okunur: bu dosya statik sunulduğu için derleme
 * zamanı ortam değişkeni gömülemez. Kaydeden taraf (src/lib/web-push.ts)
 * anahtarları `?apiKey=...&projectId=...` olarak geçer.
 *
 * Sürüm sabit: importScripts CDN'den çeker ve tarayıcı bu dosyayı uzun süre
 * önbellekler; aralık ("^") kullanmak günün birinde uyumsuz bir sürümün
 * sessizce yüklenmesi demektir.
 */
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

const q = new URL(self.location).searchParams;
const config = {
  apiKey: q.get("apiKey"),
  projectId: q.get("projectId"),
  messagingSenderId: q.get("messagingSenderId"),
  appId: q.get("appId"),
};

if (config.apiKey && config.projectId) {
  firebase.initializeApp(config);
  firebase.messaging();
}
