'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { AdminUser, Paged } from '@/lib/types';

/** 3 aylık paketin karşılığı. Telegram/Instagram üzerinden ödeme alınınca bu kadar verilir. */
const DEFAULT_GRANT_DAYS = 90;

/**
 * Manuel premium verme diyaloğu. Component DIŞINDA: içinde `Date.now()` var ve
 * component gövdesindeki her çağrı react-hooks/purity tarafından render fazı
 * sayılıyor (yalnız onClick'ten çağrılsa bile).
 */
function promptGrantPremium(
  email: string,
  onGrant: (validUntil?: string) => void,
): void {
  const input = window.prompt(
    `${email} için kaç GÜNLÜK premium verilsin?\n\n` +
      `3 aylık paket = ${DEFAULT_GRANT_DAYS} gün (varsayılan).\n` +
      'Yalnız sayı gir; süresiz vermek için "suresiz" yaz.',
    String(DEFAULT_GRANT_DAYS),
  );
  if (input === null) return; // vazgeçildi

  const raw = input.trim().toLocaleLowerCase('tr-TR');

  if (raw === 'suresiz' || raw === 'süresiz') {
    if (!window.confirm(`${email} SÜRESİZ premium olacak. Emin misin?`)) return;
    onGrant(undefined);
    return;
  }

  const days = Number(raw);
  // Boş/metin/0/negatif girdi sessizce "süresiz"e düşmemeli. Eski hata buydu:
  // Number('90 gün') → NaN → new Date(NaN).toISOString() RangeError fırlatıyordu
  // (mutation hiç çağrılmıyor, ErrorBox da görünmüyordu); boş bırakmak ise
  // 3 aylık ödeme karşılığında ömür boyu premium veriyordu.
  if (!Number.isFinite(days) || days <= 0) {
    window.alert(`Geçersiz gün sayısı: "${input}". Yalnız pozitif bir sayı gir (ör. ${DEFAULT_GRANT_DAYS}).`);
    return;
  }
  onGrant(new Date(Date.now() + days * 864e5).toISOString());
}

/** Kullanıcı yönetimi (Doc 9 §5): arama, askıya alma, manuel premium. Parola YOK. */
export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['users', search, page],
    queryFn: () =>
      api<Paged<AdminUser>>(`/admin/users?search=${encodeURIComponent(search)}&page=${page}`),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      api(`/admin/users/${id}/status`, { method: 'POST', body: { status } }),
    onSuccess: invalidate,
  });

  const setPremium = useMutation({
    mutationFn: ({ id, isPremium, validUntil }: { id: string; isPremium: boolean; validUntil?: string }) =>
      api(`/admin/users/${id}/premium`, { method: 'POST', body: { isPremium, validUntil } }),
    onSuccess: invalidate,
  });

  const totalPages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;

  return (
    <>
      <PageHeader title="Kullanıcılar" subtitle="Arama, askıya alma, manuel premium" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput);
          setPage(1);
        }}
        className="mb-4"
      >
        <input
          placeholder="E-posta veya isim ara…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
      </form>

      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          {(setStatus.isError || setPremium.isError) && (
            <div className="mb-4">
              <ErrorBox error={setStatus.error ?? setPremium.error} />
            </div>
          )}
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">Kullanıcı</th>
                  <th className="px-3 py-3 font-medium">Durum</th>
                  <th className="px-3 py-3 font-medium">Premium</th>
                  <th className="px-3 py-3 font-medium">Kayıt</th>
                  <th className="px-3 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {q.data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium">{u.displayName}</div>
                      <div className="text-xs text-slate-500">
                        {u.email}
                        {u.roles.filter((r) => r !== 'user').length > 0 && (
                          <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                            {u.roles.filter((r) => r !== 'user').join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.status === 'active' ? 'Aktif' : 'Askıda'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {u.isPremium ? (
                        <span className="text-xs">
                          ⭐ {u.validUntil ? `→ ${new Date(u.validUntil).toLocaleDateString('tr-TR')}` : 'süresiz'}
                        </span>
                      ) : u.premiumExpired ? (
                        <span className="text-xs text-amber-600">
                          ⌛ süresi doldu ({new Date(u.validUntil!).toLocaleDateString('tr-TR')})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-3 text-xs">
                        <button
                          onClick={() =>
                            setStatus.mutate({
                              id: u.id,
                              status: u.status === 'active' ? 'suspended' : 'active',
                            })
                          }
                          className="text-slate-600 hover:underline"
                        >
                          {u.status === 'active' ? 'Askıya al' : 'Aktifleştir'}
                        </button>
                        <button
                          onClick={() => {
                            if (u.isPremium) {
                              if (window.confirm(`${u.email} için premium geri alınsın mı?`)) {
                                setPremium.mutate({ id: u.id, isPremium: false });
                              }
                            } else {
                              promptGrantPremium(u.email, (validUntil) =>
                                setPremium.mutate({ id: u.id, isPremium: true, validUntil }),
                              );
                            }
                          }}
                          className="text-violet-600 hover:underline"
                        >
                          {u.isPremium ? 'Premium al' : u.premiumExpired ? 'Yenile' : 'Premium ver'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {q.data.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                      Kullanıcı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{q.data.total} kullanıcı</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                ← Önceki
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sonraki →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
