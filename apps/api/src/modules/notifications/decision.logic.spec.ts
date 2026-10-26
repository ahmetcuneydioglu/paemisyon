import {
  decide,
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
