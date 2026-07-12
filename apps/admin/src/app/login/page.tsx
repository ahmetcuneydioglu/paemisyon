'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/**
 * Panel girişi (Doc 9 §6): Supabase Auth ile oturum aç, ardından /me'den rol
 * doğrula — admin/editor değilse oturumu kapat. Yetki kararı SUNUCUDA.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: authError } = await supabase().auth.signInWithPassword({ email, password });
      if (authError) {
        setError('E-posta veya parola hatalı.');
        return;
      }
      const me = await api<{ roles: string[] }>('/me');
      if (!me.roles.includes('admin') && !me.roles.includes('editor')) {
        await supabase().auth.signOut();
        setError('Bu panele yalnızca admin/editör hesapları girebilir.');
        return;
      }
      router.replace('/');
    } catch {
      setError('Giriş doğrulanamadı. API çalışıyor mu?');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Paemisyon Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Yönetim paneline giriş</p>

        <label className="mt-6 block text-sm font-medium">E-posta</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <label className="mt-4 block text-sm font-medium">Parola</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </main>
  );
}
