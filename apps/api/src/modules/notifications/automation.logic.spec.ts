import {
  automationVars,
  parseSchedule,
  resolveAutomationLink,
  scheduleDue,
  trDayKey,
  trTodayAt,
  trWeekday,
  userTimeTarget,
} from './automation.logic';

/** 26 Eki 2026 Pazartesi 09:00 TR = 06:00Z. */
const MON_0900 = new Date('2026-10-26T06:00:00.000Z');

describe('automation.logic — takvim', () => {
  it('trDayKey ve trWeekday TR takvimini verir', () => {
    expect(trDayKey(MON_0900)).toBe('2026-10-26');
    expect(trWeekday(MON_0900)).toBe(1);
    // 23:30 TR (20:30Z) hâlâ aynı gün; 00:30 TR ertesi gün.
    expect(trDayKey(new Date('2026-10-26T20:30:00Z'))).toBe('2026-10-26');
    expect(trDayKey(new Date('2026-10-26T21:30:00Z'))).toBe('2026-10-27');
  });

  it('daily: anı gelince bir kez, pencere dışında değil', () => {
    const s = parseSchedule({ kind: 'daily', at: '09:00' })!;
    expect(scheduleDue(s, null, new Date('2026-10-26T05:59:00Z')).due).toBe(false);
    const r = scheduleDue(s, null, MON_0900);
    expect(r.due).toBe(true);
    expect(r.fireAt?.toISOString()).toBe('2026-10-26T06:00:00.000Z');
    // Aynı an için koşulduysa tekrar değil.
    expect(scheduleDue(s, r.fireAt, new Date('2026-10-26T06:20:00Z')).due).toBe(false);
    // Dünkü koşu bugünü engellemez.
    expect(scheduleDue(s, new Date('2026-10-25T06:00:00Z'), MON_0900).due).toBe(true);
    // 90 dk pencere aşıldı: kaçırılmış sayılır.
    expect(scheduleDue(s, null, new Date('2026-10-26T07:31:00Z')).due).toBe(false);
  });

  it('weekly: yalnız o gün', () => {
    const s = parseSchedule({ kind: 'weekly', at: '09:00', weekday: 1 })!;
    expect(scheduleDue(s, null, MON_0900).due).toBe(true);
    expect(scheduleDue(s, null, new Date('2026-10-27T06:00:00Z')).due).toBe(false);
  });

  it('user_time: dakikada bir aday, hedef saat ofsetle geri alınır', () => {
    const s = parseSchedule({ kind: 'user_time', offsetMinutes: 120 })!;
    expect(scheduleDue(s, null, MON_0900).due).toBe(true);
    expect(scheduleDue(s, MON_0900, new Date('2026-10-26T06:00:30Z')).due).toBe(false);
    expect(userTimeTarget(new Date('2026-10-26T18:00:00Z'), 120)).toBe('19:00'); // 21:00 TR − 2 sa
    expect(userTimeTarget(new Date('2026-10-26T16:00:00Z'), 0)).toBe('19:00');
    expect(userTimeTarget(new Date('2026-10-26T21:30:00Z'), 60)).toBe('23:30'); // 00:30 TR − 1 sa
  });

  it('trTodayAt: 00:30 TR anında "bugün 23:00" aynı TR gününün akşamıdır', () => {
    expect(trTodayAt(new Date('2026-10-26T21:30:00Z'), '23:00').toISOString()).toBe(
      '2026-10-27T20:00:00.000Z',
    );
  });

  it('parseSchedule geçersiz girdiyi reddeder', () => {
    expect(() => parseSchedule({ kind: 'daily', at: '25:00' })).toThrow();
    expect(() => parseSchedule({ kind: 'weekly', at: '09:00', weekday: 8 })).toThrow();
    expect(() => parseSchedule({ kind: 'cron', expr: '* * * * *' })).toThrow();
    expect(parseSchedule(null)).toBeNull();
  });
});

describe('automation.logic — bağlantı ve değişkenler', () => {
  it('$payload parametresi yükten okunur; eksikse bağlantı yok', () => {
    const link = { target: 'exam', params: { examId: '$payload.examId' } };
    expect(resolveAutomationLink(link, { examId: 'abc' })).toEqual({
      target: 'exam',
      params: { examId: 'abc' },
    });
    expect(resolveAutomationLink(link, {})).toBeNull();
    expect(resolveAutomationLink({ target: 'yok' }, {})).toBeNull();
    expect(resolveAutomationLink({ target: 'home' }, {})).toEqual({ target: 'home', params: {} });
  });

  it('değişkenler kitle + yükten dolar, sayılar TR biçiminde', () => {
    const v = automationVars(
      {
        streakCurrent: 7,
        examDaysLeft: 30,
        answered7d: 94,
        accuracy30d: 61.4 as never,
        dailyGoal: 20,
        answeredToday: 12,
      },
      { title: 'Haftalık 12', net: 61.25, before: 60, rival: 'Ayşe', need: 3, questionCount: 100 },
      'https://paemisyon.com/denemeler',
    );
    expect(v).toMatchObject({
      streak: 7,
      sinava_kalan_gun: 30,
      hafta_soru: 94,
      hafta_dogruluk: 61,
      kalan_soru: 8,
      deneme_adi: 'Haftalık 12',
      net: '61,25',
      onceki_net: '60',
      rakip: 'Ayşe',
      gerekli_dogru: '3',
      soru_sayisi: '100',
      link: 'https://paemisyon.com/denemeler',
    });
    expect(automationVars(null, {}, null).kalan_soru).toBeNull();
  });
});
