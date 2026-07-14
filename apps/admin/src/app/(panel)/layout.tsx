'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/questions', label: 'Sorular', icon: '❓' },
  { href: '/review', label: 'Onay Kuyruğu', icon: '✅' },
  { href: '/reports', label: 'Soru Bildirimleri', icon: '🚩' },
  { href: '/exams', label: 'Denemeler', icon: '📝' },
  { href: '/catalog', label: 'İçerik Ağacı', icon: '🗂️' },
  { href: '/users', label: 'Kullanıcılar', icon: '👥', adminOnly: true },
  { href: '/audit', label: 'İşlem Kayıtları', icon: '📜', adminOnly: true },
] as const;

/** Panel kabuğu: kenar menü + oturum/rol kapısı (Doc 9 §3, §6). */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ email: string; roles: string[] } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase().auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }
      try {
        const profile = await api<{ email: string; roles: string[] }>('/me');
        if (cancelled) return;
        if (!profile.roles.includes('admin') && !profile.roles.includes('editor')) {
          await supabase().auth.signOut();
          router.replace('/login');
          return;
        }
        setMe(profile);
      } catch {
        router.replace('/login');
        return;
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Yükleniyor…
      </div>
    );
  }

  const isAdmin = me.roles.includes('admin');

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="text-base font-semibold">Paemisyon</div>
          <div className="text-xs text-slate-500">Yönetim Paneli</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.filter((n) => !('adminOnly' in n && n.adminOnly) || isAdmin).map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active
                    ? 'bg-indigo-50 font-medium text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span aria-hidden>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="truncate text-xs text-slate-500">{me.email}</div>
          <div className="mt-0.5 text-xs text-slate-400">{me.roles.join(', ')}</div>
          <button
            onClick={async () => {
              await supabase().auth.signOut();
              router.replace('/login');
            }}
            className="mt-2 text-xs font-medium text-red-600 hover:underline"
          >
            Çıkış yap
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
