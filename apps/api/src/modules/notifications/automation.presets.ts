import type {
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationAutomationStatus,
} from '@prisma/client';
import type { Group } from './segment-dsl';
import type { DeepLinkTarget } from './deep-links';
import type { AppEventType } from './app-events.service';

/**
 * Otomasyon takvimi (Doc 52 §4.4):
 *  - daily / weekly: TR saatinde sabit an (weekday 1=Pzt … 7=Paz).
 *  - user_time: kullanıcının tercih saati (`reminderTime`, vars. 19:00) + ofset.
 */
export type AutomationSchedule =
  | { kind: 'daily'; at: string }
  | { kind: 'weekly'; at: string; weekday: number }
  | { kind: 'user_time'; field: 'reminderTime'; offsetMinutes: number };

/** Derin bağlantı parametresi `$payload.<alan>` ile olay yükünden okunabilir. */
export type AutomationDeepLink = { target: DeepLinkTarget; params?: Record<string, string> };

export type AutomationPreset = {
  code: string;
  name: string;
  description: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  triggerType: 'schedule' | 'event';
  schedule?: AutomationSchedule;
  eventType?: AppEventType;
  delayMinutes?: number;
  /** Kitle tablosu üstünde segment DSL; boş = koşulsuz. */
  conditions?: Group;
  /** Yayın olayı (deneme/çıkmış sınav yayını): olay bir kişiye değil, koşulu sağlayan BÜTÜN kitleye açılır. */
  broadcast?: boolean;
  /** Olay yükü üstünde kod içi süzgeç (panelden değişmez): yarım tur, hatırlatma türü vb. */
  when?: (payload: Record<string, unknown>) => boolean;
  /** Tekil anahtar: aynı kullanıcıya aynı anahtarla ikinci gönderim düşer. Vars.: `<code>:<gün>` ya da `<code>:<olay>`. */
  dedupe?: (payload: Record<string, unknown>, dayKey: string) => string;
  title: string;
  body: string;
  ctaLabel?: string;
  deepLink: AutomationDeepLink;
  emailSubject?: string;
  emailBody?: string;
  conversionEvent?: string;
  attributionWindowHours?: number;
  cooldownHours: number;
  maxPerUserPerDay: number;
  respectQuietHours: boolean;
  countTowardCaps?: boolean;
  ttlHours: number;
  /**
   * F1'de cron ile zaten çalışan dört gönderici (deneme hatırlatma/sonuç, net
   * güncellemesi, sıralama dürtmesi) olaya taşınırken davranış kesilmesin diye
   * `active` tohumlanır; kalan set "kapalı doğar, admin açar" (Doc 52 §8).
   */
  initialStatus: NotificationAutomationStatus;
};

const rule = (field: string, cmp: string, value?: unknown) => ({ field, cmp, value });
const and = (...rules: ReturnType<typeof rule>[]): Group => ({ op: 'and', rules });

export const AUTOMATION_PRESETS: AutomationPreset[] = [
  {
    code: 'daily_question',
    name: 'Günün sorusu hazır',
    description: 'Her sabah 09.00; günün sorusunu çözmemiş, push cihazı olan adaylara.',
    category: 'daily_question',
    priority: 'low',
    channels: ['push', 'inbox'],
    triggerType: 'schedule',
    schedule: { kind: 'daily', at: '09:00' },
    conditions: and(rule('dailyQuestionDoneToday', 'is_false'), rule('pushEnabled', 'is_true')),
    title: 'Günün sorusu hazır',
    body: 'Bugünkü soru iki dakikanı alır; serini korumanın en kısa yolu.',
    ctaLabel: 'Soruyu aç',
    deepLink: { target: 'daily_question' },
    conversionEvent: 'daily_question_completed',
    cooldownHours: 20,
    maxPerUserPerDay: 1,
    respectQuietHours: true,
    ttlHours: 12,
    initialStatus: 'paused',
  },
  {
    code: 'daily_study_reminder',
    name: 'Bugünkü hedefin seni bekliyor',
    description: 'Kullanıcının hatırlatma saatinde (vars. 19.00); günlük hedef dolmamışsa.',
    category: 'study_reminder',
    priority: 'low',
    channels: ['push'],
    triggerType: 'schedule',
    schedule: { kind: 'user_time', field: 'reminderTime', offsetMinutes: 0 },
    conditions: and(rule('dailyGoalDoneToday', 'is_false'), rule('pushEnabled', 'is_true')),
    title: 'Bugünkü hedefin seni bekliyor',
    body: '{{kalan_soru}} soru kaldı; on dakikalık bir tur yeter.',
    deepLink: { target: 'home' },
    conversionEvent: 'session_completed',
    cooldownHours: 20,
    maxPerUserPerDay: 1,
    respectQuietHours: true,
    ttlHours: 4,
    initialStatus: 'paused',
  },
  {
    code: 'streak_at_risk',
    name: 'Serin bozulmak üzere',
    description: 'Hatırlatma saati + 2 saat; seri ≥ 3 ve bugün hedef dolmadıysa.',
    category: 'streak',
    priority: 'low',
    channels: ['push', 'inbox'],
    triggerType: 'schedule',
    schedule: { kind: 'user_time', field: 'reminderTime', offsetMinutes: 120 },
    conditions: and(
      rule('streakCurrent', 'gte', 3),
      rule('dailyGoalDoneToday', 'is_false'),
      rule('pushEnabled', 'is_true'),
    ),
    title: 'Serin 23.00’te bozuluyor',
    body: '{{streak}} günlük seri için beş soruluk mini seans yeter.',
    ctaLabel: 'Seriyi koru',
    deepLink: { target: 'home' },
    conversionEvent: 'session_completed',
    cooldownHours: 20,
    maxPerUserPerDay: 1,
    respectQuietHours: true,
    ttlHours: 3,
    initialStatus: 'paused',
  },
  ...([3, 5, 7] as const).map<AutomationPreset>((d) => ({
    code: `inactive_${d}`,
    name: d === 7 ? 'Yumuşak dönüş (7 gün)' : `${d} gündür görünmüyor`,
    description: `Günlük 19.00; son aktiflik tam ${d} gün olan adaylara, 48 saat arayla.`,
    category: 'study_reminder',
    priority: 'low',
    channels: ['push'],
    triggerType: 'schedule',
    schedule: { kind: 'daily', at: '19:00' },
    conditions: and(rule('lastActiveDays', 'eq', d), rule('pushEnabled', 'is_true')),
    title: d === 3 ? 'Kaldığın yerden' : d === 5 ? 'Beş gün oldu' : 'Nöbet defteri seni bekliyor',
    body:
      d === 3
        ? 'Üç gündür yoksun; beş soruluk bir tur ısınma için yeter.'
        : d === 5
          ? 'Zayıf konun hâlâ aynı yerde; on dakikada bir adım atılır.'
          : 'Baskı yok: tek bir soruyla başla, gerisi gelir.',
    deepLink: { target: 'home' },
    conversionEvent: 'session_completed',
    cooldownHours: 48,
    maxPerUserPerDay: 1,
    respectQuietHours: true,
    ttlHours: 6,
    initialStatus: 'paused',
  })),
  {
    code: 'inactive_30_email',
    name: 'Uzun ara e-postası',
    description: 'Pazartesi 09.00; 30+ gündür aktif olmayan, e-posta abonesi adaylara kısa köprü.',
    category: 'study_reminder',
    priority: 'low',
    channels: ['email'],
    triggerType: 'schedule',
    schedule: { kind: 'weekly', at: '09:00', weekday: 1 },
    conditions: and(rule('lastActiveDays', 'gte', 30), rule('emailSubscribed', 'is_true')),
    title: 'Kaldığın yer duruyor',
    body: 'Yanlışların, favorilerin ve planın seni bekliyor; tek soruyla dönebilirsin.',
    emailSubject: 'Kaldığın yer duruyor',
    emailBody:
      'Merhaba {{ad|Aday}},\n\nBir aydır görüşmedik. Yanlışların, favorilerin ve planın olduğu gibi duruyor.\n\nTek bir soruyla dönmek yeter: [Bugünkü soruyu aç]({{link}})',
    deepLink: { target: 'home' },
    cooldownHours: 24 * 14,
    maxPerUserPerDay: 1,
    respectQuietHours: false,
    ttlHours: 48,
    initialStatus: 'paused',
  },
  {
    code: 'exam_published',
    name: 'Yeni deneme yayında',
    description:
      'Deneme yayınlanınca (olay); hedef modülü eşleşen adaylara. Yayın ekranındaki "duyur" kutusuyla çakışmasın: biri seçilir.',
    category: 'exam',
    priority: 'normal',
    channels: ['push', 'inbox', 'email'],
    triggerType: 'event',
    eventType: 'exam_published',
    broadcast: true,
    conditions: and(rule('onboardingDone', 'is_true')),
    dedupe: (p) => `exam:${String(p.examId)}:published`,
    title: 'Yeni deneme yayında',
    body: '{{deneme_adi}}: {{soru_sayisi}} soru, {{sure}} dakika. Türkiye sıralamasında yerini al.',
    ctaLabel: 'Denemeyi gör',
    deepLink: { target: 'exam', params: { examId: '$payload.examId' } },
    emailSubject: 'Yeni deneme yayında: {{deneme_adi}}',
    emailBody:
      'Merhaba {{ad|Aday}},\n\n**{{deneme_adi}}** yayında: {{soru_sayisi}} soru, {{sure}} dakika.\n\n[Denemeyi aç]({{link}})',
    conversionEvent: 'exam_submitted',
    attributionWindowHours: 72,
    cooldownHours: 0,
    maxPerUserPerDay: 2,
    respectQuietHours: true,
    ttlHours: 48,
    initialStatus: 'paused',
  },
  {
    code: 'exam_reminder_day_before',
    name: 'Deneme yarın',
    description:
      'Haftalık deneme için 24 saat kala (exams cron olayı); hatırlatma isteyen katılımcıya.',
    category: 'exam',
    priority: 'normal',
    channels: ['push', 'inbox', 'email'],
    triggerType: 'event',
    eventType: 'exam_reminder_due',
    when: (p) => p.kind === 'day_before',
    dedupe: (p) => `exam:${String(p.examId)}:day_before`,
    title: '{{deneme_adi}} yarın {{saat}}’de',
    body: '150 dakika kesintisiz zaman ayır; sınav bitene kadar giriş açık.',
    ctaLabel: 'Denemeyi gör',
    deepLink: { target: 'exam', params: { examId: '$payload.examId' } },
    emailSubject: '{{deneme_adi}} yarın {{saat}}’de',
    emailBody:
      'Merhaba {{ad|Aday}},\n\n**{{deneme_adi}}** yarın {{saat}}’de başlıyor. 150 dakika kesintisiz zaman ayır.\n\n[Denemeyi aç]({{link}})',
    conversionEvent: 'exam_submitted',
    attributionWindowHours: 48,
    cooldownHours: 0,
    maxPerUserPerDay: 2,
    respectQuietHours: true,
    ttlHours: 24,
    initialStatus: 'active',
  },
  {
    code: 'exam_reminder_hour_before',
    name: 'Denemeye 1 saat',
    description: 'Haftalık deneme için 1 saat kala (exams cron olayı); sessiz saati deler.',
    category: 'exam',
    priority: 'high',
    channels: ['push', 'inbox'],
    triggerType: 'event',
    eventType: 'exam_reminder_due',
    when: (p) => p.kind === 'hour_before',
    dedupe: (p) => `exam:${String(p.examId)}:hour_before`,
    title: '{{deneme_adi}} 1 saat sonra {{saat}}’de',
    body: '150 dakika kesintisiz zaman ayır; sınav bitene kadar giriş açık.',
    ctaLabel: 'Denemeye gir',
    deepLink: { target: 'exam', params: { examId: '$payload.examId' } },
    conversionEvent: 'exam_submitted',
    attributionWindowHours: 6,
    cooldownHours: 0,
    maxPerUserPerDay: 2,
    respectQuietHours: false,
    ttlHours: 1,
    initialStatus: 'active',
  },
  {
    code: 'exam_result_ready',
    name: 'Sonucun açıklandı',
    description: 'Haftalık deneme penceresi kapanıp sıralama dondurulunca; katılan herkese.',
    category: 'exam',
    priority: 'normal',
    channels: ['push', 'inbox'],
    triggerType: 'event',
    eventType: 'exam_result_ready',
    dedupe: (p) => `exam:${String(p.examId)}:result_ready`,
    title: 'Sonucun açıklandı',
    body: '{{deneme_adi}}: netin ve sıran hazır.',
    ctaLabel: 'Sonucu gör',
    deepLink: { target: 'exam_result', params: { sessionId: '$payload.sessionId' } },
    conversionEvent: 'exam_review',
    cooldownHours: 0,
    maxPerUserPerDay: 3,
    respectQuietHours: false,
    ttlHours: 48,
    initialStatus: 'active',
  },
  {
    code: 'exam_net_updated',
    name: 'Netin güncellendi',
    description: 'Soru iptali sonrası yeniden puanlama; neti değişen katılımcıya.',
    category: 'exam',
    priority: 'normal',
    channels: ['push', 'inbox'],
    triggerType: 'event',
    eventType: 'exam_net_updated',
    dedupe: (p) => `exam:${String(p.examId)}:net_updated:${String(p.adjustmentId ?? p.at ?? '')}`,
    title: 'Netin güncellendi',
    body: '{{deneme_adi}}: bir soru iptal edildi; netin {{onceki_net}} → {{net}}.',
    ctaLabel: 'Sonucu gör',
    deepLink: { target: 'exam_result', params: { sessionId: '$payload.sessionId' } },
    cooldownHours: 0,
    maxPerUserPerDay: 3,
    respectQuietHours: true,
    ttlHours: 48,
    initialStatus: 'active',
  },
  {
    code: 'exam_abandoned',
    name: 'Yarım kalan deneme',
    description: 'Deneme oturumu yarım bırakılınca (olay, 30 dk sonra); oturum hâlâ açıksa.',
    category: 'exam',
    priority: 'normal',
    channels: ['push', 'inbox'],
    triggerType: 'event',
    eventType: 'exam_abandoned',
    delayMinutes: 30,
    conditions: and(rule('hasOpenExam', 'is_true')),
    dedupe: (p) => `exam_abandoned:${String(p.sessionId)}`,
    title: 'Denemen yarım kaldı',
    body: '{{deneme_adi}}: {{soru_no}}. sorudan devam edebilirsin; süre işliyor.',
    ctaLabel: 'Devam et',
    deepLink: { target: 'exam', params: { examId: '$payload.examId' } },
    conversionEvent: 'exam_submitted',
    cooldownHours: 2,
    maxPerUserPerDay: 2,
    respectQuietHours: true,
    ttlHours: 3,
    initialStatus: 'paused',
  },
  {
    code: 'exam_countdown',
    name: 'Sınava geri sayım',
    description:
      'Günlük 10.00; sınava 60 · 30 · 14 · 7 · 3 · 1 gün kala (hedef tarih ya da sınav takvimi).',
    category: 'exam_countdown',
    priority: 'normal',
    channels: ['push', 'inbox'],
    triggerType: 'schedule',
    schedule: { kind: 'daily', at: '10:00' },
    conditions: and(rule('examDaysLeft', 'in', [60, 30, 14, 7, 3, 1])),
    dedupe: (_p, day) => `exam_countdown:${day}`,
    title: 'Sınava {{sinava_kalan_gun}} gün',
    body: 'Plan sabit, tempo senin: bugün bir tur, bir tekrar.',
    ctaLabel: 'Bugüne bak',
    deepLink: { target: 'home' },
    cooldownHours: 20,
    maxPerUserPerDay: 1,
    respectQuietHours: true,
    ttlHours: 10,
    initialStatus: 'paused',
  },
  {
    code: 'weekly_report',
    name: 'Haftalık rapor',
    description:
      'Pazartesi 09.00; son 7 günde soru çözmüş, e-posta abonesi adaylara (kutu özeti de yazılır).',
    category: 'statistics',
    priority: 'low',
    channels: ['email', 'inbox'],
    triggerType: 'schedule',
    schedule: { kind: 'weekly', at: '09:00', weekday: 1 },
    conditions: and(rule('answered7d', 'gt', 0)),
    title: 'Haftalık raporun hazır',
    body: 'Bu hafta {{hafta_soru}} soru, %{{hafta_dogruluk}} doğruluk. Serin: {{streak}} gün.',
    ctaLabel: 'Raporu gör',
    deepLink: { target: 'statistics' },
    emailSubject: 'Haftalık raporun: {{hafta_soru}} soru, %{{hafta_dogruluk}} doğruluk',
    emailBody:
      'Merhaba {{ad|Aday}},\n\nBu hafta **{{hafta_soru}}** soru çözdün; doğruluğun **%{{hafta_dogruluk}}**. Serin **{{streak}}** gün.\n\nSınava kalan: {{sinava_kalan_gun|—}} gün.\n\n[Performansını gör]({{link}})',
    cooldownHours: 24 * 6,
    maxPerUserPerDay: 1,
    respectQuietHours: false,
    countTowardCaps: false,
    ttlHours: 72,
    initialStatus: 'paused',
  },
  {
    code: 'question_report_resolved',
    name: 'Bildirdiğin soru sonuçlandı',
    description: 'Soru bildirimi çözülünce ya da değişiklik gerekmeyince bildiren adaya.',
    category: 'question_report',
    priority: 'normal',
    channels: ['push', 'inbox'],
    triggerType: 'event',
    eventType: 'question_report_resolved',
    dedupe: (p) => `question_report:${String(p.reportId)}`,
    title: 'Bildirdiğin soru sonuçlandı',
    body: '{{sonuc}}',
    ctaLabel: 'Soruyu gör',
    deepLink: { target: 'question', params: { id: '$payload.questionId' } },
    cooldownHours: 0,
    maxPerUserPerDay: 5,
    respectQuietHours: true,
    ttlHours: 72,
    initialStatus: 'paused',
  },
  {
    code: 'badge_unlocked',
    name: 'Rozet kazanıldı',
    description: 'Rozet kazanılınca yalnız kutuya.',
    category: 'achievement',
    priority: 'low',
    channels: ['inbox'],
    triggerType: 'event',
    eventType: 'badge_unlocked',
    dedupe: (p) => `badge:${String(p.key)}`,
    title: 'Yeni rozet: {{rozet}}',
    body: 'Rozetlerin arasında yerini aldı.',
    ctaLabel: 'Rozetlerim',
    deepLink: { target: 'badges' },
    cooldownHours: 0,
    maxPerUserPerDay: 10,
    respectQuietHours: false,
    countTowardCaps: false,
    ttlHours: 24 * 30,
    initialStatus: 'paused',
  },
  {
    code: 'leaderboard_climb',
    name: 'Sıralamada bir basamak',
    description: '20.30 TR; bugün oynamış ve gün içinde geçilmiş adaya, günde bir (pozitif dil).',
    category: 'leaderboard',
    priority: 'low',
    channels: ['push', 'inbox'],
    triggerType: 'event',
    eventType: 'leaderboard_overtaken',
    dedupe: (_p, day) => `leaderboard_climb:${day}`,
    title: 'Sıralamada bir basamak',
    body: '{{rakip}} bugün bir basamak önüne geçti. {{gerekli_dogru}} doğruyla sırayı geri alırsın.',
    ctaLabel: 'Sıralamaya bak',
    deepLink: { target: 'leaderboard' },
    conversionEvent: 'session_completed',
    cooldownHours: 20,
    maxPerUserPerDay: 1,
    respectQuietHours: true,
    ttlHours: 3,
    initialStatus: 'active',
  },
  {
    code: 'new_past_exam',
    name: 'Yeni çıkmış sınav',
    description: 'Çıkmış sınav yayınlanınca (olay) herkese.',
    category: 'new_content',
    priority: 'normal',
    channels: ['push', 'inbox', 'email'],
    triggerType: 'event',
    eventType: 'past_exam_published',
    broadcast: true,
    conditions: and(rule('onboardingDone', 'is_true')),
    dedupe: (p) => `past_exam:${String(p.slug)}`,
    title: '{{sinav_adi}} soruları eklendi',
    body: 'Resmî sınavın tamamı bankada; gerçek sınav düzeninde çöz.',
    ctaLabel: 'Sınavı aç',
    deepLink: { target: 'past_exam', params: { slug: '$payload.slug' } },
    emailSubject: '{{sinav_adi}} soruları eklendi',
    emailBody:
      'Merhaba {{ad|Aday}},\n\n**{{sinav_adi}}** soruları bankaya eklendi; gerçek sınav düzeninde çözebilirsin.\n\n[Sınavı aç]({{link}})',
    cooldownHours: 0,
    maxPerUserPerDay: 1,
    respectQuietHours: true,
    ttlHours: 72,
    initialStatus: 'paused',
  },
];

export const PRESET_BY_CODE = new Map(AUTOMATION_PRESETS.map((p) => [p.code, p]));
