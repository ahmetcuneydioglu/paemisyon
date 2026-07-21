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
  { href: '/law-articles', label: 'Madde Metinleri', icon: '📖' },
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
  const [navOpen, setNavOpen] = useState(false);

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
      {/* Mobil üst çubuk: hamburger + başlık (md ve üstünde gizli). */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Menüyü aç"
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-base font-semibold">Paemisyon</span>
      </header>

      {/* Mobil çekmece arka planı (açıkken). */}
      {navOpen && (
        <button
          aria-label="Menüyü kapat"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      {/* Kenar menü: masaüstünde akışta sabit; mobilde soldan kayan çekmece. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-base font-semibold">Paemisyon</div>
            <div className="text-xs text-slate-500">Yönetim Paneli</div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Menüyü kapat"
            className="-mr-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.filter((n) => !('adminOnly' in n && n.adminOnly) || isAdmin).map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setNavOpen(false)}
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

      {/* İçerik: mobilde üst çubuk için pt-16, dar padding; masaüstünde geniş. */}
      <main className="min-w-0 flex-1 p-4 pt-16 md:p-8">{children}</main>
    </div>
  );
}
