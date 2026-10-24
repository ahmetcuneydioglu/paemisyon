'use client';

import { useState } from 'react';
import type {
  AdminExamDetail,
  CatalogModule,
  ExamDifficulty,
  ExamPublishMode,
} from '@/lib/types';

export interface ExamFormValue {
  title: string;
  description: string;
  startAt: string; // ISO
  endAt: string | null; // ISO; takvimlide pencere kapanışı, serbestte arşiv tarihi
  durationMinutes: number;
  publishMode: ExamPublishMode;
  difficulty: ExamDifficulty | null;
  examTypeId: string | null;
  isPremium: boolean;
  liveAnswerReveal: boolean;
  questionsOpenAfterEnd: boolean;
  practiceAfterEnd: boolean;
  remindEnabled: boolean;
}

/** Sonraki Pazar 21:00 (yerel saat) — haftalık deneme varsayılanı (24 Eki 2026 kararı). */
export function nextSunday21(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Pazar
  const add = day === 0 && d.getHours() < 21 ? 0 : (7 - day) % 7 || 7;
  d.setDate(d.getDate() + add);
  d.setHours(21, 0, 0, 0);
  return d;
}

export function emptyExam(): ExamFormValue {
  const start = nextSunday21();
  return {
    title: '',
    description: '',
    startAt: start.toISOString(),
    endAt: new Date(start.getTime() + 150 * 60_000).toISOString(),
    durationMinutes: 150, // PAEM resmî süresi
    publishMode: 'takvimli',
    difficulty: 'orta',
    examTypeId: null,
    isPremium: false,
    liveAnswerReveal: false,
    questionsOpenAfterEnd: true,
    practiceAfterEnd: true,
    remindEnabled: true,
  };
}

export function toFormValue(e: AdminExamDetail): ExamFormValue {
  return {
    title: e.title,
    description: e.description ?? '',
    startAt: e.startAt,
    endAt: e.endAt,
    durationMinutes: e.durationMinutes,
    publishMode: e.publishMode,
    difficulty: e.difficulty,
    examTypeId: e.examTypeId,
    isPremium: e.isPremium,
    liveAnswerReveal: e.liveAnswerReveal,
    questionsOpenAfterEnd: e.questionsOpenAfterEnd,
    practiceAfterEnd: e.practiceAfterEnd,
    remindEnabled: e.remindEnabled,
  };
}

/** ISO ↔ datetime-local (yerel saat) dönüşümü. */
function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const input =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50';

const DIFFICULTIES: { v: ExamDifficulty; l: string }[] = [
  { v: 'kolay', l: 'Kolay' },
  { v: 'orta', l: 'Orta' },
  { v: 'zor', l: 'Zor' },
];

/**
 * Sihirbaz 1. adım — Kimlik (Doc 50 A1): ad, açıklama, zorluk, yayın modu, açılış,
 * süre, pencere kapanışı, sınav türü. Soru seti ve ayarlar sonraki adımlarda.
 */
export function ExamIdentityForm({
  initial,
  modules,
  submitLabel,
  busy,
  disabled = false,
  onSubmit,
  onChange,
}: {
  initial: ExamFormValue;
  modules: CatalogModule[];
  submitLabel: string;
  busy: boolean;
  disabled?: boolean;
  onSubmit: (v: ExamFormValue) => void;
  onChange?: (v: ExamFormValue) => void;
}) {
  const [v, setV] = useState<ExamFormValue>(initial);
  const set = (patch: Partial<ExamFormValue>) =>
    setV((p) => {
      const next = { ...p, ...patch };
      onChange?.(next);
      return next;
    });
  const takvimli = v.publishMode === 'takvimli';
  const endOk = !v.endAt || new Date(v.endAt) > new Date(v.startAt);
  const valid =
    v.title.trim().length >= 3 && v.durationMinutes >= 5 && !!v.startAt && endOk;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !disabled) onSubmit(v);
      }}
      className="max-w-3xl space-y-5"
    >
      <div>
        <label className="block text-sm font-medium">Deneme adı</label>
        <input
          required
          disabled={disabled}
          value={v.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Örn: Haftalık Deneme 12"
          className={input}
        />
        <p className="mt-1 text-xs text-slate-400">Adaya kartta ve bildirimde görünür.</p>
      </div>

      <div>
        <label className="block text-sm font-medium">Açıklama (opsiyonel)</label>
        <textarea
          rows={2}
          disabled={disabled}
          value={v.description}
          onChange={(e) => set({ description: e.target.value })}
          className={input}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <div>
          <label className="block text-sm font-medium">Zorluk</label>
          <div className="mt-1 inline-flex rounded-lg bg-slate-100 p-0.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.v}
                type="button"
                disabled={disabled}
                onClick={() => set({ difficulty: d.v })}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  v.difficulty === d.v ? 'bg-white font-medium shadow-sm' : 'text-slate-600'
                }`}
              >
                {d.l}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-56">
          <label className="block text-sm font-medium">Sınav türü</label>
          <select
            disabled={disabled}
            value={v.examTypeId ?? ''}
            onChange={(e) => set({ examTypeId: e.target.value || null })}
            className={input}
          >
            <option value="">Seç…</option>
            {modules
              .filter((m) => m.isActive)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Ders dağılımı ve otomatik doldurma bundan.
          </p>
        </div>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium">Yayın modu</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                v: 'serbest',
                t: 'Serbest deneme',
                d: 'Yayından sonra aday istediği zaman çözer; tek resmî çözüm, sıralama katılımla güncellenir.',
              },
              {
                v: 'takvimli',
                t: 'Haftalık (takvimli)',
                d: 'Belirlenen saatte açılır, sınav bitene kadar giriş yapılabilir; sıralama pencere kapanınca donar.',
              },
            ] as { v: ExamPublishMode; t: string; d: string }[]
          ).map((o) => {
            const sel = v.publishMode === o.v;
            return (
              <label
                key={o.v}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                  sel ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                } ${disabled ? 'cursor-default opacity-70' : ''}`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  className="mt-1"
                  disabled={disabled}
                  checked={sel}
                  onChange={() =>
                    set({
                      publishMode: o.v,
                      endAt:
                        o.v === 'takvimli'
                          ? new Date(
                              new Date(v.startAt).getTime() + v.durationMinutes * 60_000,
                            ).toISOString()
                          : null,
                    })
                  }
                />
                <span>
                  <span className="block text-sm font-medium">{o.t}</span>
                  <span className="block text-xs text-slate-500">{o.d}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium">
            {takvimli ? 'Açılış (tarih + saat)' : 'Yayın anı'}
          </label>
          <input
            type="datetime-local"
            required
            disabled={disabled}
            value={isoToLocal(v.startAt)}
            onChange={(e) => {
              if (!e.target.value) return;
              const startAt = new Date(e.target.value);
              set({
                startAt: startAt.toISOString(),
                endAt: takvimli
                  ? new Date(startAt.getTime() + v.durationMinutes * 60_000).toISOString()
                  : v.endAt,
              });
            }}
            className={input}
          />
          <p className="mt-1 text-xs text-slate-400">
            {takvimli ? 'Varsayılan: sonraki Pazar 21:00' : 'Bu andan önce listede görünmez'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium">Süre (dk)</label>
          <input
            type="number"
            min={5}
            max={600}
            required
            disabled={disabled}
            value={v.durationMinutes}
            onChange={(e) => {
              const durationMinutes = Number(e.target.value);
              set({
                durationMinutes,
                endAt: takvimli
                  ? new Date(new Date(v.startAt).getTime() + durationMinutes * 60_000).toISOString()
                  : v.endAt,
              });
            }}
            className={`${input} w-28`}
          />
          <p className="mt-1 text-xs text-slate-400">PAEM resmî süresi 150 dk</p>
        </div>
        <div>
          <label className="block text-sm font-medium">
            {takvimli ? 'Pencere kapanışı' : 'Yeni çözüme kapanış (opsiyonel)'}
          </label>
          <input
            type="datetime-local"
            disabled={disabled}
            value={isoToLocal(v.endAt)}
            onChange={(e) =>
              set({ endAt: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
            className={input}
          />
          <p className={`mt-1 text-xs ${endOk ? 'text-slate-400' : 'text-red-600'}`}>
            {!endOk
              ? 'Kapanış, açılıştan sonra olmalı.'
              : takvimli
                ? 'Açılış + süre; sonuçlar bu anda açıklanır'
                : 'Boş = süresiz açık'}
          </p>
        </div>
      </div>

      {!disabled && (
        <button
          type="submit"
          disabled={!valid || busy}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor…' : submitLabel}
        </button>
      )}
    </form>
  );
}

function Toggle({
  label,
  help,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  help: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 ${
        disabled ? 'opacity-70' : 'cursor-pointer hover:border-slate-300'
      }`}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{help}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          className="peer sr-only"
          disabled={disabled}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Sihirbaz 2. adım — Ayarlar (Doc 50 A2): erişim, çözüm deneyimi, bildirimler. */
export function ExamSettingsForm({
  value,
  disabled = false,
  busy,
  submitLabel,
  onSubmit,
}: {
  value: ExamFormValue;
  disabled?: boolean;
  busy: boolean;
  submitLabel: string;
  onSubmit: (v: ExamFormValue) => void;
}) {
  const [v, setV] = useState(value);
  const set = (patch: Partial<ExamFormValue>) => setV((p) => ({ ...p, ...patch }));
  const takvimli = v.publishMode === 'takvimli';
  return (
    <div className="max-w-3xl space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Erişim</h3>
        <Toggle
          label="Premium'a özel"
          help="Yalnız Premium adaylar çözer; ücretsiz adaya kart kilitli görünür. Sonuç ekranındaki Premium ayrımı (Türkiye kıyası vb.) bundan bağımsızdır."
          checked={v.isPremium}
          disabled={disabled}
          onChange={(b) => set({ isPremium: b })}
        />
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Çözüm deneyimi</h3>
        <Toggle
          label="Resmî çözümde anlık geri bildirim"
          help="Açıkken aday şıkka dokunur dokunmaz doğru/yanlış ve açıklamayı görür, cevap kilitlenir. Kapalıyken gerçek sınav gibi: cevaplar sona kadar gizli. Tekrar çözümde her zaman açıktır."
          checked={v.liveAnswerReveal}
          disabled={disabled}
          onChange={(b) => set({ liveAnswerReveal: b })}
        />
        <Toggle
          label={takvimli ? 'Bitince pratik çözüme aç' : 'Kapanınca pratik çözüme aç'}
          help={
            takvimli
              ? 'Pencere kapanınca deneme "Pratik olarak çöz" ile açık kalır; sıralama donmuş kalır.'
              : 'Serbest denemede tekrar çözüm zaten açıktır; bu anahtar yalnız kapanış tarihi dolunca anlam taşır.'
          }
          checked={v.practiceAfterEnd}
          disabled={disabled}
          onChange={(b) => set({ practiceAfterEnd: b })}
        />
        <Toggle
          label="Sınav bitince sorular herkese açık görüntülenebilsin"
          help="Cevapsız soru listesi (/denemeler/:id/sorular). Yayınlanmış kitapçık mantığı."
          checked={v.questionsOpenAfterEnd}
          disabled={disabled}
          onChange={(b) => set({ questionsOpenAfterEnd: b })}
        />
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Bildirimler</h3>
        <Toggle
          label="Hatırlatma ve sonuç bildirimi"
          help={
            takvimli
              ? '"Hatırlat" diyen adaya 1 gün ve 1 saat önce push; pencere kapanıp sıralama hesaplanınca katılan herkese "sonucun açıklandı".'
              : 'Serbest denemede yalnız yayınlandığında duyuru (yayın adımında seçilir).'
          }
          checked={v.remindEnabled}
          disabled={disabled}
          onChange={(b) => set({ remindEnabled: b })}
        />
      </section>
      {!disabled && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmit(v)}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor…' : submitLabel}
        </button>
      )}
    </div>
  );
}
