import {
  decide,
  emailConsentFor,
  engagementTierFor,
  inQuietHours,
  quietHoursEnd,
  trClock,
  type DecisionContext,
  type DecisionInput,
} from './decision.logic';

/** 26 Eki 2026 TR 20:00 = UTC 17:00 (TR sabit UTC+3). */
const at = (hhTR: number, mm = 0) => new Date(Date.UTC(2026, 9, 26, hhTR - 3, mm));

const ctx = (o: Partial<DecisionContext> = {}): DecisionContext => ({
  now: at(20),
  killSwitch: false,
  environmentOk: true,
  accountActive: true,
  duplicate: false,
  settings: { categories: null, quietStart: '23:00', quietEnd: '08:00', pushEnabled: true },
  emailConsent: true,
  hasActiveDevice: true,
  sentToday: 0,
  marketingSentToday: 0,
  dailyCap: 3,
  marketingDailyCap: 1,
  engagementTier: 0,
  pushesThisWeek: 0,
  decayWeeklyCap: 2,
  ...o,
});
const input = (o: Partial<DecisionInput> = {}): DecisionInput => ({
  category: 'exam',
  priority: 'normal',
  channels: ['push', 'inbox'],
  respectQuietHours: true,
  countTowardCaps: true,
  ttlHours: 24,
  cooldownActive: false,
  ...o,
});

describe('karar akışı (Doc 52 §6)', () => {
  it('TR saati doğru okunur', () => {
    expect(trClock(at(20, 30))).toEqual({ h: 20, m: 30 });
  });

  it('kill switch ve ortam kapısı her şeyi düşürür, kutu da yazılmaz', () => {
    expect(decide(input(), ctx({ killSwitch: true })).dropAll).toBe('kill_switch');
    expect(decide(input(), ctx({ environmentOk: false })).dropAll).toBe('environment');
    expect(decide(input(), ctx({ accountActive: false })).dropAll).toBe('account_inactive');
    expect(decide(input(), ctx({ duplicate: true })).dropAll).toBe('duplicate');
  });

  it('normal durumda push ve kutu gider', () => {
    const d = decide(input(), ctx());
    expect(d.dropAll).toBeNull();
    expect(d.inbox).toBe(true);
    expect(d.channels.push).toEqual({ action: 'send' });
    expect(d.channels.inbox).toEqual({ action: 'send' });
  });

  it('kategori kapalıysa hiçbir kanal gitmez, kutu da yazılmaz', () => {
    const d = decide(
      input(),
      ctx({
        settings: {
          categories: { exam: false },
          quietStart: '23:00',
          quietEnd: '08:00',
          pushEnabled: true,
        },
      }),
    );
    expect(d.inbox).toBe(false);
    expect(d.channels.push).toEqual({ action: 'drop', reason: 'category_disabled' });
  });

  it('system kapatılamaz; critical yalnız system olur, başka kategoride high', () => {
    const d = decide(
      input({ category: 'system', priority: 'critical' }),
      ctx({
        settings: {
          categories: { system: false },
          quietStart: '23:00',
          quietEnd: '08:00',
          pushEnabled: true,
        },
        now: at(2),
      }),
    );
    expect(d.channels.push).toEqual({ action: 'send' });
    const e = decide(input({ priority: 'critical' }), ctx());
    expect(e.priority).toBe('high');
  });

  it('kanal politikası: marketing push alamaz, achievement yalnız kutu', () => {
    const d = decide(input({ category: 'marketing', channels: ['push', 'email'] }), ctx());
    expect(d.channels.push).toEqual({ action: 'drop', reason: 'channel_policy' });
    expect(d.channels.email).toEqual({ action: 'send' });
    const a = decide(input({ category: 'achievement', channels: ['push', 'inbox'] }), ctx());
    expect(a.channels.push?.action).toBe('drop');
    expect(a.inbox).toBe(true);
  });

  it('e-posta rızası yoksa e-posta düşer, push gider', () => {
    const d = decide(input({ channels: ['push', 'email'] }), ctx({ emailConsent: false }));
    expect(d.channels.email).toEqual({ action: 'drop', reason: 'no_consent' });
    expect(d.channels.push).toEqual({ action: 'send' });
  });

  it('sessiz saat: normal öncelik ttl içinde ertelenir, günlük kategori düşer, high ertelenir', () => {
    expect(inQuietHours(at(23, 30), '23:00', '08:00')).toBe(true);
    expect(inQuietHours(at(7, 59), '23:00', '08:00')).toBe(true);
    expect(inQuietHours(at(8), '23:00', '08:00')).toBe(false);
    expect(inQuietHours(at(12), '23:00', '08:00')).toBe(false);
    const end = quietHoursEnd(at(23, 30), '08:00');
    expect(trClock(end)).toEqual({ h: 8, m: 0 });

    const d = decide(input(), ctx({ now: at(23, 30) }));
    expect(d.channels.push?.action).toBe('defer');
    expect(d.scheduledAt.getTime()).toBe(end.getTime());

    const s = decide(input({ category: 'streak' }), ctx({ now: at(23, 30) }));
    expect(s.channels.push).toEqual({ action: 'drop', reason: 'quiet_hours' });

    const short = decide(input({ ttlHours: 1 }), ctx({ now: at(23, 30) }));
    expect(short.channels.push).toEqual({ action: 'drop', reason: 'quiet_hours_expired' });

    const h = decide(input({ ttlHours: 1, priority: 'high' }), ctx({ now: at(23, 30) }));
    expect(h.channels.push?.action).toBe('defer');
  });

  it('günlük kapı: low düşer, normal ertesi güne ertelenir, high aşar', () => {
    const l = decide(input({ priority: 'low' }), ctx({ sentToday: 3 }));
    expect(l.channels.push).toEqual({ action: 'drop', reason: 'daily_cap' });
    const n = decide(input(), ctx({ sentToday: 3 }));
    expect(n.channels.push?.action).toBe('defer');
    const h = decide(input({ priority: 'high' }), ctx({ sentToday: 3 }));
    expect(h.channels.push).toEqual({ action: 'send' });
    const dq = decide(input({ category: 'daily_question' }), ctx({ sentToday: 3 }));
    expect(dq.channels.push).toEqual({ action: 'drop', reason: 'daily_cap' });
  });

  it('sönüm (Doc 24): tier 1 haftada 2, tier 2 yalnız e-posta; kutu ve e-posta etkilenmez', () => {
    const t1 = decide(
      input({ channels: ['push', 'inbox', 'email'] }),
      ctx({ engagementTier: 1, pushesThisWeek: 2 }),
    );
    expect(t1.channels.push).toEqual({ action: 'drop', reason: 'decay_weekly' });
    expect(t1.channels.email).toEqual({ action: 'send' });
    expect(t1.inbox).toBe(true);
    const t2 = decide(input(), ctx({ engagementTier: 2 }));
    expect(t2.channels.push).toEqual({ action: 'drop', reason: 'decay_email_only' });
  });

  it("sönüm muafiyeti: soru bildirimi sonucu ve system push'u tier 2'de de gider (kullanıcı kendi eylemine yanıt bekler)", () => {
    const qr = decide(
      input({ category: 'question_report', channels: ['push', 'inbox', 'email'] }),
      ctx({ engagementTier: 2 }),
    );
    expect(qr.channels.push).toEqual({ action: 'send' });
    expect(qr.channels.email).toEqual({ action: 'send' });
    const qr1 = decide(
      input({ category: 'question_report' }),
      ctx({ engagementTier: 1, pushesThisWeek: 5 }),
    );
    expect(qr1.channels.push).toEqual({ action: 'send' });
    const sys = decide(input({ category: 'system' }), ctx({ engagementTier: 2 }));
    expect(sys.channels.push).toEqual({ action: 'send' });
    // Muafiyet yalnız sönümü aşar; günlük kapı ve cihaz kuralı olduğu gibi kalır.
    const nodev = decide(
      input({ category: 'question_report' }),
      ctx({ engagementTier: 2, hasActiveDevice: false }),
    );
    expect(nodev.channels.push).toEqual({ action: 'drop', reason: 'no_device' });
  });

  it('cihaz yoksa push düşer, kutu yazılır', () => {
    const d = decide(input(), ctx({ hasActiveDevice: false }));
    expect(d.channels.push).toEqual({ action: 'drop', reason: 'no_device' });
    expect(d.inbox).toBe(true);
  });

  it('pazarlama günlük kapısı e-postayı düşürür', () => {
    const d = decide(
      input({ category: 'marketing', channels: ['email'] }),
      ctx({ marketingSentToday: 1 }),
    );
    expect(d.channels.email).toEqual({ action: 'drop', reason: 'marketing_cap' });
  });
});

describe('emailConsentFor — rıza kişide yaşar, kişisiz hesap hizmet e-postasına açıktır', () => {
  const sub = (unsub: string[] = []) => ({ status: 'subscribed', unsubscribedTopics: unsub });

  it('konu yoksa (kategori e-posta taşımıyor) rıza yok', () => {
    expect(emailConsentFor(null, [sub()])).toBe(false);
  });
  it('kişi yok: duyuru rızalı, kampanya rızasız (gönderim katmanı kişiyi live_user açar)', () => {
    expect(emailConsentFor('duyuru', [])).toBe(true);
    expect(emailConsentFor('kampanya', [])).toBe(false);
  });
  it('abone kişi, konu kapatılmamış → rıza var', () => {
    expect(emailConsentFor('duyuru', [sub()])).toBe(true);
    expect(emailConsentFor('kampanya', [sub()])).toBe(true);
  });
  it('abone kişi ama konu kapalı → rıza yok', () => {
    expect(emailConsentFor('kampanya', [sub(['kampanya'])])).toBe(false);
    expect(emailConsentFor('duyuru', [sub(['kampanya'])])).toBe(true);
  });
  it('abonelikten çıkmış ya da bastırılmış kişi → kişisiz gibi sayılmaz, rıza yok', () => {
    expect(emailConsentFor('duyuru', [{ status: 'unsubscribed', unsubscribedTopics: [] }])).toBe(
      false,
    );
    expect(emailConsentFor('duyuru', [{ status: 'suppressed', unsubscribedTopics: [] }])).toBe(
      false,
    );
  });
  it('birden çok kişi: abone olan öne alınır', () => {
    expect(
      emailConsentFor('duyuru', [{ status: 'unsubscribed', unsubscribedTopics: [] }, sub()]),
    ).toBe(true);
  });
});

describe('engagementTierFor — sönüm (Doc 24 §7/6): cevap = push açma YA DA uygulama içi etkinlik', () => {
  const now = at(20);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
  const base = {
    now,
    pushSent7d: 6,
    pushSent30d: 20,
    lastPushOpenedAt: null,
    answered7d: 0,
    lastAnsweredAt: null,
  };

  it('push hiç açılmamış, uygulama da açılmamış: 30 günde ≥5 push → 2; 7 günde → 1', () => {
    expect(engagementTierFor(base)).toBe(2);
    expect(engagementTierFor({ ...base, pushSent30d: 4 })).toBe(1);
    expect(engagementTierFor({ ...base, pushSent30d: 4, pushSent7d: 4 })).toBe(0);
  });

  it('push açılmışsa süre ölçüsüyle: 7 gün içi → 0, 8–30 gün → 1, 30+ gün → 2', () => {
    expect(engagementTierFor({ ...base, lastPushOpenedAt: daysAgo(2) })).toBe(0);
    expect(engagementTierFor({ ...base, lastPushOpenedAt: daysAgo(10) })).toBe(1);
    expect(engagementTierFor({ ...base, lastPushOpenedAt: daysAgo(40) })).toBe(2);
  });

  it('aktif ama push açmamış kullanıcı (10 Kas 2026 bulgusu): son 7 günde ≥20 cevap → 0', () => {
    expect(engagementTierFor({ ...base, answered7d: 105 * 7, lastAnsweredAt: daysAgo(0) })).toBe(0);
    expect(engagementTierFor({ ...base, answered7d: 20, lastAnsweredAt: daysAgo(5) })).toBe(0);
  });

  it('az cevaplı ama son 3 günde cevap vermiş → 0; 3 günden eski ve <20 cevap → sönüm işler', () => {
    expect(engagementTierFor({ ...base, answered7d: 3, lastAnsweredAt: daysAgo(2) })).toBe(0);
    expect(engagementTierFor({ ...base, answered7d: 3, lastAnsweredAt: daysAgo(5) })).toBe(2);
    expect(engagementTierFor({ ...base, answered7d: 19, lastAnsweredAt: daysAgo(4) })).toBe(2);
  });
});
