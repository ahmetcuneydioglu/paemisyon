/**
 * Derin bağlantı kayıt defteri (Doc 52 §5) — TEK kaynak. Her hedef iki çıktı
 * üretir: `route` (mobil sözlüğü; apps/app/src/lib/deep-links.ts routeToHref
 * olduğu gibi anlar) ve `webPath` (FCM webpush bağlantısı ve kutu tıklaması).
 * Mobil `minAppVersion`'dan küçükse `/bildirimler`e düşer.
 */
export type DeepLinkTarget =
  | 'daily_question'
  | 'question'
  | 'exams'
  | 'exam'
  | 'exam_result'
  | 'leaderboard'
  | 'review'
  | 'library'
  | 'legislation'
  | 'past_exam'
  | 'statistics'
  | 'plan'
  | 'badges'
  | 'membership'
  | 'notifications'
  | 'settings_notifications'
  | 'home';

export type DeepLink = { target: DeepLinkTarget; params?: Record<string, string> };
export type ResolvedLink = { route: string; webPath: string; minAppVersion: string };

type Entry = {
  param?: string;
  route: (p: string) => string;
  webPath: (p: string) => string;
  minAppVersion: string;
};

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const SLUG = /^[a-z0-9-]{1,80}$/;

export const DEEP_LINKS: Record<DeepLinkTarget, Entry> = {
  home: { route: () => '', webPath: () => '/bugun', minAppVersion: '2.0.0' },
  daily_question: {
    route: () => 'daily-quiz',
    webPath: () => '/seans?mode=daily&source=notif',
    minAppVersion: '2.0.0',
  },
  question: {
    param: 'id',
    route: (p) => `question:${p}`,
    webPath: (p) => `/seans?mode=practice&questionId=${p}&count=1&source=notif`,
    minAppVersion: '2.0.0',
  },
  exams: { route: () => 'denemeler', webPath: () => '/denemeler', minAppVersion: '2.0.0' },
  exam: {
    param: 'examId',
    route: (p) => `/denemeler/${p}`,
    webPath: (p) => `/denemeler/${p}`,
    minAppVersion: '2.0.0',
  },
  exam_result: {
    param: 'sessionId',
    route: (p) => `deneme-sonuc/${p}`,
    webPath: (p) => `/sonuc/${p}`,
    minAppVersion: '2.0.0',
  },
  leaderboard: { route: () => 'leaderboard', webPath: () => '/liderlik', minAppVersion: '2.0.0' },
  review: {
    route: () => '/review',
    webPath: () => '/seans?mode=review&scope=Yanl%C4%B1%C5%9F%20tekrar%C4%B1',
    minAppVersion: '2.0.0',
  },
  library: { route: () => '/catalog', webPath: () => '/kutuphane', minAppVersion: '2.0.0' },
  legislation: {
    param: 'legislationId',
    route: (p) => `/kanunlar/${p}`,
    webPath: (p) => `/kanunlar/${p}`,
    minAppVersion: '2.1.0',
  },
  past_exam: {
    param: 'slug',
    route: () => '/denemeler/cikmis',
    webPath: (p) => (p ? `/paem-cikmis-sorular/${p}` : '/paem-cikmis-sorular'),
    minAppVersion: '2.0.0',
  },
  statistics: { route: () => '/performans', webPath: () => '/performans', minAppVersion: '2.1.0' },
  plan: { route: () => '/planim', webPath: () => '/planim', minAppVersion: '2.1.0' },
  badges: {
    route: () => '/ben/rozetler',
    webPath: () => '/profil/rozetler',
    minAppVersion: '2.1.0',
  },
  membership: { route: () => '/ben/uyelik', webPath: () => '/profil', minAppVersion: '2.0.0' },
  notifications: {
    route: () => '/bildirimler',
    webPath: () => '/bildirimler',
    minAppVersion: '2.1.0',
  },
  settings_notifications: {
    route: () => '/ben/ayarlar',
    webPath: () => '/profil/bildirimler',
    minAppVersion: '2.1.0',
  },
};

export const DEEP_LINK_TARGETS = Object.keys(DEEP_LINKS) as DeepLinkTarget[];

export function isDeepLinkTarget(t: unknown): t is DeepLinkTarget {
  return typeof t === 'string' && t in DEEP_LINKS;
}

/** Hedef + parametreyi rota ve web yoluna çevirir; parametre doğrulanır. */
export function resolveDeepLink(link: DeepLink | null | undefined): ResolvedLink {
  if (!link || !isDeepLinkTarget(link.target)) return resolveDeepLink({ target: 'home' });
  const entry = DEEP_LINKS[link.target];
  let p = '';
  if (entry.param) {
    p = String(link.params?.[entry.param] ?? '').trim();
    const ok = entry.param === 'slug' ? p === '' || SLUG.test(p) : UUID.test(p);
    if (!ok) throw new Error(`Derin bağlantı parametresi geçersiz: ${link.target}.${entry.param}`);
  }
  return { route: entry.route(p), webPath: entry.webPath(p), minAppVersion: entry.minAppVersion };
}

/** Eski üreticiler (route dizgesi) için: mobil rotayı web yoluna çevirir. */
export function webPathFromRoute(route: string | null | undefined): string {
  const r = (route ?? '').trim();
  if (!r) return '/bugun';
  if (r === 'daily-quiz') return DEEP_LINKS.daily_question.webPath('');
  if (r === 'denemeler') return '/denemeler';
  if (r === 'leaderboard') return '/liderlik';
  const sonuc = r.match(/^deneme-sonuc\/([0-9a-fA-F-]{36})$/);
  if (sonuc) return `/sonuc/${sonuc[1]}`;
  const soru = r.match(/^question:(.+)$/);
  if (soru && UUID.test(soru[1])) return DEEP_LINKS.question.webPath(soru[1]);
  if (r.startsWith('/') && !r.startsWith('//')) return r;
  return '/bugun';
}
