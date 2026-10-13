import type { DailyFocusView, Readiness } from './home-v2.types';
import { computeTodayTask, TodayTaskInput, YarimTur } from './today-task.logic';

const NOW = new Date('2026-10-14T03:40:00.000Z'); // 06:40 TR, Çarşamba
const KOC: DailyFocusView = { kind: 'coach', courseId: null, topicId: null, label: null };
const hazirlik = (over: Partial<Readiness> = {}): Readiness => ({
  courses: [],
  weakest: [{ topicId: 't1', name: 'Temel Haklar ve Ödevler', courseName: 'Anayasa Hukuku', accuracy: 0.38, solved: 26 }],
  unresolvedWrongCount: 0,
  ...over,
});
const tur = (over: Partial<YarimTur> = {}): YarimTur => ({
  sessionId: 's1',
  mode: 'practice',
  total: 10,
  answered: 4,
  startedAt: new Date(NOW.getTime() - 3_600_000),
  lastActivityAt: new Date(NOW.getTime() - 3_000_000),
  scopeName: 'Koç turu',
  ...over,
});
const girdi = (over: Partial<TodayTaskInput> = {}): TodayTaskInput => ({
  now: NOW,
  trHour: 6,
  goal: 20,
  answeredToday: 0,
  totalSolved: 500,
  daysSinceLastActivity: 1,
  daysToExam: 142,
  weekly: { activeDays: 2, goalDays: 5 },
  daysLeftInWeek: 5,
  exams: { live: null, todayUpcoming: null },
  activeSession: null,
  focus: KOC,
  readiness: hazirlik(),
  strongestTopic: { name: 'Kasten Öldürme', accuracy: 0.7 },
  ...over,
});

describe('computeTodayTask — tek birincil eylem (Doc 48 §4)', () => {
  it('S1 normal: 10 soruluk koç turu, gerekçe en zayıf konudan, etiket = davranış', () => {
    const t = computeTodayTask(girdi());
    expect(t.kind).toBe('start');
    expect(t.action).toEqual({ type: 'start_session', label: 'Başla · 10 soru', count: 10, recipe: 'coach', source: 'home_task' });
    expect(t.reason).toBe('Ağırlık: Temel Haklar ve Ödevler (%38 doğru).');
    expect(t.progress).toEqual({ label: 'Bugün 0/20 soru', answered: 0, total: 20 });
  });

  it('tur boyu: kalan 7 → 7 soru; kalan 2 → en az 5', () => {
    expect(computeTodayTask(girdi({ answeredToday: 13 })).action.count).toBe(7);
    expect(computeTodayTask(girdi({ answeredToday: 18 })).action.count).toBe(5);
  });

  it('S2 taze yarım tur görev kartının kendisi; günün halkası gizli, çıkış bağlantısı var', () => {
    const t = computeTodayTask(girdi({ activeSession: tur() }));
    expect(t.kind).toBe('resume');
    expect(t.action).toMatchObject({ type: 'resume_session', label: 'Devam et · 6 soru', sessionId: 's1' });
    expect(t.progress).toEqual({ label: '4/10 soru', answered: 4, total: 10 });
    expect(t.finishSessionId).toBe('s1');
    expect(t.secondary).toBeNull();
  });

  it('yarım turun zamanı uygulama gününe göre: bugünse saat, önceki günse "dün"', () => {
    const bugun = computeTodayTask(girdi({ activeSession: tur({ lastActivityAt: new Date('2026-10-14T03:14:00Z') }) }));
    expect(bugun.reason).toBe('Koç turu · son cevap 06:14');
    // 13 Eki 22:10 TR — önceki uygulama günü (24 saatten yeni, hâlâ taze).
    const dun = computeTodayTask(girdi({ activeSession: tur({ lastActivityAt: new Date('2026-10-13T19:10:00Z') }) }));
    expect(dun.kind).toBe('resume');
    expect(dun.reason).toBe('Koç turu · son cevap dün 22:10');
  });

  it('hiç cevaplanmamış taze tur "yarım" değil "hazır": aynı seti başlatır', () => {
    const t = computeTodayTask(girdi({ activeSession: tur({ answered: 0, scopeName: 'Polis Mevzuatı' }) }));
    expect(t.title).toBe('Turun hazır');
    expect(t.action).toMatchObject({ type: 'resume_session', label: 'Başla · 10 soru', sessionId: 's1' });
    expect(t.progress).toBeNull();
    expect(t.finishSessionId).toBeNull();
  });

  it('cevapsız eski tur ikincil satır olmaz; yanlışlar görünür', () => {
    const bos = tur({ answered: 0, lastActivityAt: new Date(NOW.getTime() - 2 * 86_400_000) });
    const t = computeTodayTask(girdi({ activeSession: bos, readiness: hazirlik({ unresolvedWrongCount: 8 }) }));
    expect(t.secondary?.kind).toBe('wrongs');
  });

  it('eski yarım tur (1–7 gün) görevi işgal etmez, ikincil satır olur', () => {
    const eski = tur({ lastActivityAt: new Date(NOW.getTime() - 3 * 86_400_000), answered: 1, total: 20 });
    const t = computeTodayTask(girdi({ activeSession: eski }));
    expect(t.kind).toBe('start');
    expect(t.secondary).toMatchObject({
      kind: 'stale_session',
      title: '3 gün önce yarım kalan tur',
      subtitle: '1/20 soru · Koç turu',
      action: { type: 'resume_session', sessionId: 's1' },
    });
  });

  it('7 günden eski tur hiç gösterilmez (sunucu zaten kapatır)', () => {
    const cokEski = tur({ lastActivityAt: new Date(NOW.getTime() - 8 * 86_400_000) });
    expect(computeTodayTask(girdi({ activeSession: cokEski })).secondary).toBeNull();
  });

  it('S4 ilk gün: 20 değil 10 soru, ikincil satır yok', () => {
    const t = computeTodayTask(girdi({ totalSolved: 0, readiness: hazirlik({ weakest: [], unresolvedWrongCount: 3 }) }));
    expect(t.kind).toBe('first');
    expect(t.action.count).toBe(10);
    expect(t.secondary).toBeNull();
  });

  it('S5 dönüş (≥5 gün): güçlü konudan gerçekten 5 soru, suçluluk dili yok', () => {
    const t = computeTodayTask(girdi({ daysSinceLastActivity: 10 }));
    expect(t.kind).toBe('comeback');
    expect(t.action).toMatchObject({ label: 'Başla · 5 soru', count: 5, recipe: 'comeback' });
    expect(t.reason).toBe('Güçlü konundan 5 soru — 3 dakika. Kasten Öldürme: %70 doğru.');
    expect(t.reason).not.toMatch(/bekliyor/);
    expect(t.secondary).toBeNull();
  });

  it('dönüş eşiği: 4 gün normal, 5 gün dönüş (Doc 24 §3)', () => {
    expect(computeTodayTask(girdi({ daysSinceLastActivity: 4 })).kind).toBe('start');
    expect(computeTodayTask(girdi({ daysSinceLastActivity: 5 })).kind).toBe('comeback');
  });

  it('haftalık risk: akşam + bugün 0 + bugün kaçarsa hedef tutmaz', () => {
    // Cumartesi (2 gün kaldı), 3/5 aktif → 2 eksik ≥ 2 kalan: risk.
    const t = computeTodayTask(girdi({ trHour: 20, weekly: { activeDays: 3, goalDays: 5 }, daysLeftInWeek: 2 }));
    expect(t.kind).toBe('weekly_risk');
    expect(t.title).toBe('Bu haftanın 4. günü için');
    expect(t.action).toMatchObject({ label: 'Başla · 5 soru', count: 5 });
  });

  it('haftalık risk yok: sabah, ya da bugün çözüldü, ya da hedef zaten erişilebilir', () => {
    const risk = { weekly: { activeDays: 3, goalDays: 5 }, daysLeftInWeek: 2 };
    expect(computeTodayTask(girdi({ ...risk, trHour: 9 })).kind).toBe('start');
    expect(computeTodayTask(girdi({ ...risk, trHour: 20, answeredToday: 3 })).kind).toBe('start');
    expect(computeTodayTask(girdi({ ...risk, trHour: 20, daysLeftInWeek: 4 })).kind).toBe('start');
  });

  it('hedef tamam: ekstra tur isteğe bağlı', () => {
    const t = computeTodayTask(girdi({ answeredToday: 20 }));
    expect(t.kind).toBe('done');
    expect(t.action.label).toBe('Ekstra tur · 10 soru');
    expect(t.progress).toEqual({ label: 'Bugün 20/20 soru', answered: 20, total: 20 });
  });

  it('deneme yarım kaldıysa her şeyi ezer', () => {
    const t = computeTodayTask(
      girdi({
        activeSession: tur(),
        exams: { live: { id: 'e1', title: 'Ekim Denemesi', endAt: NOW, attempted: false, inProgress: true }, todayUpcoming: null },
      }),
    );
    expect(t.kind).toBe('exam');
    expect(t.action).toMatchObject({ type: 'open_exams', route: '/denemeler/e1' });
  });

  it('bugün deneme var: ikincil satır kısa ısınma', () => {
    const t = computeTodayTask(
      girdi({ exams: { live: null, todayUpcoming: { id: 'e2', title: 'Ekim Denemesi', startAt: new Date('2026-10-14T07:00:00Z') } } }),
    );
    expect(t.kind).toBe('exam');
    expect(t.title).toBe('Deneme bugün 10:00');
    expect(t.secondary).toMatchObject({ kind: 'warmup', action: { count: 5, source: 'home_suggestion' } });
  });

  it('odak etikete ve eyleme yansır (Doc 25 §5)', () => {
    const focus: DailyFocusView = { kind: 'topic', courseId: 'c1', topicId: 't9', label: 'Yürütme' };
    const t = computeTodayTask(girdi({ focus }));
    expect(t.action).toMatchObject({ label: 'Başla · 10 soru · Yürütme', focus });
    expect(t.reason).toBe('Odak: Yürütme. Soruları koç seçiyor.');
  });

  it('yanlış odağı: yanlış sayısı kadar (≤20); yanlış kalmadıysa koça döner ve söyler', () => {
    const wrongs: DailyFocusView = { kind: 'wrongs', courseId: null, topicId: null, label: null };
    const t = computeTodayTask(girdi({ focus: wrongs, readiness: hazirlik({ unresolvedWrongCount: 4 }) }));
    expect(t.title).toBe('Yanlış turu');
    expect(t.action).toMatchObject({ label: 'Başla · 4 yanlış', count: 4, focus: wrongs });
    const bos = computeTodayTask(girdi({ focus: wrongs, readiness: hazirlik({ unresolvedWrongCount: 0 }) }));
    expect(bos.reason).toBe('Çözülmemiş yanlışın kalmadı — koç karışık tur kurdu.');
    expect(bos.action.focus).toBeUndefined();
  });

  it('ikincil satır en çok 1: eski tur yanlışlardan önce gelir', () => {
    const eski = tur({ lastActivityAt: new Date(NOW.getTime() - 2 * 86_400_000) });
    const t = computeTodayTask(girdi({ activeSession: eski, readiness: hazirlik({ unresolvedWrongCount: 9 }) }));
    expect(t.secondary?.kind).toBe('stale_session');
    const t2 = computeTodayTask(girdi({ readiness: hazirlik({ unresolvedWrongCount: 9 }) }));
    expect(t2.secondary).toMatchObject({ kind: 'wrongs', title: '9 çözülmemiş yanlış', subtitle: 'Yaklaşık 3 dakika' });
  });

  it('sınav moduna (≤30 gün) gerekçe pekiştirmeyi söyler', () => {
    expect(computeTodayTask(girdi({ daysToExam: 21 })).reason).toBe(
      'Sınava 21 gün — yanlışlar ve zayıf konular ağırlıklı.',
    );
  });
});
