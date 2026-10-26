import { Card, PageHeader } from '@/components/ui';

const PRESETS = [
  ['daily_question', 'Günün sorusu hazır', '09:00 TR · zamanlı', 'push · kutu'], ['daily_study_reminder', 'Bugünkü hedefin seni bekliyor', 'kullanıcının hatırlatma saati', 'push'],
  ['streak_at_risk', 'Serin 23.00’te bozuluyor', 'hatırlatma saati + 2 sa', 'push · kutu'], ['inactive_3 / 5 / 7', 'Yumuşak dönüş', '19:00 · zamanlı', 'push'],
  ['exam_published', 'Yeni deneme yayında', 'olay', 'push · kutu · e-posta'], ['exam_reminder_*', 'Yarın 21.00 / 1 saat kaldı', 'olay', 'push · kutu'],
  ['exam_result_ready', 'Sonucun açıklandı', 'olay', 'push · kutu'], ['exam_countdown', 'Sınava N gün', '10:00 · sınav takvimi', 'push · kutu'],
  ['weekly_report', 'Haftalık rapor', 'Pazartesi 09:00', 'e-posta · kutu'], ['question_report_resolved', 'Bildirdiğin soru düzeltildi', 'olay', 'push · kutu'],
  ['leaderboard_climb', 'Bir basamak yükselebilirsin', '20:30 · zamanlı', 'push'], ['badge_unlocked', 'Rozet', 'olay', 'kutu'],
];

/** Otomatik Bildirimler — F2'de açılır (Doc 52 §8). F1'de deneme hatırlatma/sonuç ve sıralama dürtmesi motora bağlı cron'larla çalışır. */
export default function AutomationsPage() {
  return (
    <div>
      <PageHeader title="Otomatik bildirimler" subtitle="İkinci fazda (Doc 52 §8): olay omurgası, zamanlı/olaylı otomasyonlar, hazır set kapalı doğar ve admin açar. Geriye dönük gönderim yok." />
      <Card className="mb-4 border-emerald-200 bg-emerald-50"><p className="text-sm text-emerald-900">Bugün motora bağlı çalışanlar: deneme hatırlatması (1 gün / 1 saat), sonuç açıklandı, net güncellendi, sıralama dürtmesi (20.30). Hepsi karar akışından geçer ve Gönderim Geçmişi’nde görünür.</p></Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PRESETS.map(([code, name, trig, ch]) => (
          <Card key={code} className="space-y-1 border-dashed bg-slate-50">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">{name}</span><span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">F2</span></div>
            <div className="font-mono text-xs text-slate-500">{code}</div>
            <div className="text-xs text-slate-500">Tetik: {trig} · Kanal: {ch}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
