# Doc 22 — Canlıya Alma (Production Deploy)

> Mimari kararı: **Vercel** (Next uygulamaları) + **Railway** (NestJS API) +
> **subdomain** yapısı. Domain **paemisyon.com** Natro'da kayıtlı; yalnız DNS
> yönlendirilir.

## Hedef adresler
| Adres | Uygulama | Platform |
|---|---|---|
| `api.paemisyon.com` | API (NestJS) | Railway |
| `admin.paemisyon.com` | Admin panel (Next.js) | Vercel |
| `paemisyon.com` | Denemeler sitesi (Next.js) | Vercel *(sonraki adım)* |
| Supabase (Frankfurt) | Auth + Postgres | Zaten canlı |

**Sıra önemli:** Panel API'ye bağımlı → önce **API (Railway)**, sonra **Admin
(Vercel)**. Web en son.

---

## Adım 0 — Kodu GitHub'a koy (bir kez)
Railway ve Vercel git deposundan deploy eder.
1. github.com → yeni **private** repo (örn. `paemisyon`).
2. Yerelde:
   ```bash
   cd /Users/ahmetcnd/Developer/paemisyon
   git remote add origin git@github.com:<kullanıcı>/paemisyon.git
   git push -u origin main
   ```
3. `.env` gitignore'da — sırlar gitmez (doğrulandı). SQL dump'ları da gitignore'da kalmalı.

---

## Adım 1 — API'yi Railway'e deploy et
1. railway.app → GitHub ile giriş → **New Project → Deploy from GitHub repo** → repo.
2. Servis **Settings**:
   - **Root Directory:** `apps/api`  *(monorepo — kritik)*
   - **Start Command:** `npm run start:prod`
     *(Railway varsayılan `npm start` = dev; prod için bunu ELLE ayarla.)*
   - Build otomatik: `prisma generate && nest build` (package.json'dan).
3. **Variables** (env — bu değerleri SEN girersin, kod/commit'e girmez):
   ```
   NODE_ENV=production
   DATABASE_URL=<.env'deki session pooler, 5432>
   DIRECT_URL=<.env'deki, 5432>
   SUPABASE_URL=https://yhkiuzevyqdqtofrmroj.supabase.co
   SUPABASE_JWT_SECRET=<Supabase → Project Settings → API → JWT secret>
   SUPABASE_SERVICE_ROLE_KEY=<Supabase → API → service_role>   # GİZLİ, yalnız burada
   CORS_ORIGINS=https://admin.paemisyon.com,https://paemisyon.com
   ```
   *(PORT'u ekleme — Railway otomatik verir, kod okur.)*
4. Deploy loglarını izle: `migrate deploy` + `API çalışıyor`.
5. **Settings → Networking → Generate Domain** (geçici `*.up.railway.app`) ile test et:
   `https://<geçici>/api/v1/health` → `{"status":"ok"}`.
6. **Custom Domain:** `api.paemisyon.com` ekle → Railway sana bir **CNAME hedefi** verir (kopyala).

## Adım 2 — Natro DNS: api kaydı
1. Natro paneli → paemisyon.com → **DNS Yönetimi**.
2. **CNAME:** ad `api` → değer = Railway'in verdiği hedef. TTL düşük (300).
3. Yayılınca (dk–saat): `https://api.paemisyon.com/api/v1/health` → `ok`.

---

## Adım 3 — Admin paneli Vercel'e deploy et
1. vercel.com → GitHub ile giriş → **Add New → Project** → repo import.
2. **Root Directory:** `apps/admin`. Framework: **Next.js** (otomatik).
3. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.paemisyon.com/api/v1
   NEXT_PUBLIC_SUPABASE_URL=https://yhkiuzevyqdqtofrmroj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key — PUBLIC, sorun değil>
   ```
4. **Deploy**. Bitince geçici `*.vercel.app` ile açılır.
5. **Settings → Domains:** `admin.paemisyon.com` ekle → Vercel **CNAME hedefi**
   verir (`cname.vercel-dns.com`).

## Adım 4 — Natro DNS: admin kaydı
- **CNAME:** ad `admin` → `cname.vercel-dns.com`. Yayılınca panel açılır.

## Adım 5 — Supabase auth URL'leri
Supabase Dashboard → **Authentication → URL Configuration:**
- **Site URL:** `https://admin.paemisyon.com`
- **Redirect URLs:** `https://admin.paemisyon.com/**`, `https://paemisyon.com/**`
*(email+şifre login için kritik değil; şifre sıfırlama/magic link için gerekir.)*

## Adım 6 — Doğrulama
- `https://api.paemisyon.com/api/v1/health` → `ok`
- `https://admin.paemisyon.com` → giriş → İçerik Ağacı yükleniyor (API'ye
  ulaşıyor demek), PDF import çalışıyor
- Tarayıcı console'da **CORS hatası olmamalı** (CORS_ORIGINS doğruysa)

---

## Lansman engelleri (kullanıcıya açmadan önce)
1. **Ücretsiz plan limiti:** DB'de `plans.free.dailyQuestionLimit = 1000` (dev
   değeri) → gerçek değere (örn. 15) çek. Prod'da seed ÇALIŞMAZ; DB'yi elle
   güncelle (SQL ya da panel). *(seed.ts'te TODO(LANSMAN) notu var.)*
2. İçerik hazır mı: 813 soru + müfredat mevcut ✓.

## Notlar / ileride
- **Maliyet:** Railway ~$5/ay (Hobby). Render ücretsiz katmanı var ama servis
  boşta uyur (API'de soğuk başlangıç kötü) — gerçek lansmanda küçük ücretli
  katman değer.
- **Dev/Prod DB ortak:** şu an tek Supabase projesi; prod API de aynı DB'yi
  kullanır (813 soru orada). İleride ayrı prod projesi düşünülebilir.
- **Web** aynı Vercel akışı: Root `apps/web`, domain `paemisyon.com` (kök — A
  kaydı `76.76.21.21` veya Vercel'in verdiği). Admin oturunca yapılır.
