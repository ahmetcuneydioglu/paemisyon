# Doc 6 — Veritabanı Tasarımı

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 2 (içerik modeli gereksinimi), Doc 3 (Postgres + Prisma), Doc 4.
> **Kapsam:** PostgreSQL şeması — tablolar, ilişkiler, sürümleme, indeks, bütünlük. API sözleşmesi Doc 7, auth detayı Doc 8.

---

## 1. Tasarım İlkeleri

1. **İçerik değişmezdir, sürümlenir.** Bir soru düzenlendiğinde eski satır silinmez; yeni sürüm oluşur, eskisi arşivlenir. Geçmiş sınav sonuçları, çözüldükleri sürüme bağlı kalır. (Mevzuat değişimi gereksiniminin doğrudan karşılığı.)
2. **İş verisi ilişkiseldir.** Doküman-veritabanı değil; sınav/soru/abonelik/istatistik güçlü ilişkilerle modellenir.
3. **Modül-agnostik çekirdek.** Yeni sınav türü = yeni `modules` satırı, şema değişikliği yok.
4. **Silme yok, arşiv var.** İçerik ve kullanıcı verisinde `deleted_at` (soft delete).
5. **Doğruluk kaynağı backend.** Freemium limit, skor, premium durum DB'de hesaplanır; istemci türetmez.

## 2. Konvansiyonlar

| Konu | Karar | Gerekçe |
|---|---|---|
| Primary key | **UUID v7** (zaman-sıralı) | Tahmin edilemez (güvenlik) + indeks yerelliği iyi (ardışık) |
| Zaman damgaları | Her tabloda `created_at`, `updated_at` (UTC `timestamptz`) | İzlenebilirlik |
| Soft delete | İçerik/kullanıcıda `deleted_at` | Veri kaybını önler |
| İsimlendirme | `snake_case`, çoğul tablo adları | Postgres konvansiyonu |
| Enum'lar | Küçük/sabit kümeler → Postgres `enum`; genişleyebilir → lookup tablo | Esneklik |
| Para | `numeric(10,2)` + `currency` | Float kullanılmaz |
| JSON | Yalnızca gerçekten şemasız veri için `jsonb` (örn. AI metadata) | Aşırı jsonb = anti-pattern |

---

## 3. ERD Genel Görünümü (alan bazında)

```
IDENTITY            CONTENT (sürümlü)                 LEARNING
─────────           ──────────────────                ─────────
users ──┐           modules                           quiz_sessions ──┐
auth_identities     └─ courses                         └─ quiz_answers │
devices             └─── topics                        bookmarks       │
roles/user_roles    └───── questions ──┐              wrong_answers    │
                            question_versions ──┐                      │
                            ├─ question_options  │                     │
                            └─ legal_references   │                    │
                                                  ▼                    ▼
PROGRESS                        SUBSCRIPTION           ENGAGEMENT / AI
─────────                       ─────────────          ────────────────
user_topic_progress             plans                  notifications
user_stats                      subscriptions          daily_questions
streaks                         iap_transactions       study_plans
daily_usage                     entitlements           recommendations
                                                        legacy_user_map (göç)
```

---

## 4. Alan Şemaları

### 4.1 Identity & Access

**users**
| Kolon | Tip | Not |
|---|---|---|
| id | uuid PK | |
| email | citext UNIQUE | büyük/küçük harf duyarsız |
| email_verified_at | timestamptz null | |
| display_name | text | |
| avatar_url | text null | Supabase Storage |
| status | enum(active, suspended, deleted) | |
| onboarding_completed_at | timestamptz null | |
| created_at / updated_at / deleted_at | timestamptz | |

> Parola **bu tabloda tutulmaz** — kimlik doğrulama `auth_identities` + Supabase Auth üzerinden (Doc 8).

**auth_identities** (bir kullanıcı = birden çok giriş yöntemi)
| Kolon | Tip | Not |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→users | |
| provider | enum(email, apple, google) | |
| provider_uid | text | sağlayıcı benzersiz kimliği |
| created_at | timestamptz | |
| | UNIQUE(provider, provider_uid) | |

**devices** (push için)
| id | uuid PK |
| user_id | uuid FK |
| platform | enum(ios, android) |
| push_token | text |
| app_version | text |
| last_seen_at | timestamptz |
| UNIQUE(push_token) |

**roles / user_roles** (admin, editör, kullanıcı — RBAC)
- `roles(id, key[admin|editor|user], name)`
- `user_roles(user_id, role_id)` — çoklu rol.

---

### 4.2 Content (sürümlü — en kritik tasarım)

**modules** (PAEM, POMEM, PMYO, Misyon, Rütbe Terfi ...)
| id | uuid PK |
| key | text UNIQUE (paem, pomem...) |
| name | text |
| description | text |
| icon | text |
| sort_order | int |
| is_active | bool |
| created_at/updated_at | |

**courses** (ders — modüle bağlı)
| id | uuid PK |
| module_id | uuid FK→modules |
| name | text (örn. Anayasa Hukuku) |
| sort_order | int |
| deleted_at | |

**topics** (konu — derse bağlı)
| id | uuid PK |
| course_id | uuid FK→courses |
| name | text |
| sort_order | int |
| is_premium | bool (freemium kilidi konu bazında) |
| deleted_at | |

**questions** (kararlı KİMLİK — içerik burada değil)
| id | uuid PK | Soru kimliği ömür boyu sabit |
| topic_id | uuid FK→topics |
| current_version_id | uuid FK→question_versions null | yayındaki sürüm |
| created_at / deleted_at | |

**question_versions** (içerik burada — DEĞİŞMEZ sürümler)
| Kolon | Tip | Not |
|---|---|---|
| id | uuid PK | |
| question_id | uuid FK→questions | |
| version_no | int | 1,2,3... |
| stem | text | soru kökü |
| explanation | text null | açıklama/çözüm |
| difficulty | enum(easy, medium, hard) | |
| media_url | text null | görsel (Storage) |
| status | enum(draft, in_review, published, archived) | editoryal akış |
| authored_by | uuid FK→users | editör |
| reviewed_by | uuid FK→users null | onaylayan |
| published_at / archived_at | timestamptz null | |
| created_at | timestamptz | |
| | UNIQUE(question_id, version_no) | |

**question_options** (şıklar — sürüme bağlı)
| id | uuid PK |
| question_version_id | uuid FK→question_versions |
| label | text (A,B,C,D,E) |
| text | text |
| is_correct | bool |
| sort_order | int |

**legal_references** (mevzuat kaynağı — güven ilkesi)
| id | uuid PK |
| question_version_id | uuid FK |
| citation | text (örn. "2559 sayılı PVSK md. 4/A") |
| url | text null |
| effective_date | date null | mevzuatın yürürlük tarihi |

> **Editoryal akış:** Bir sorunun içeriği yalnızca `question_versions.status = published` olduğunda yayına çıkar. Mevzuat değişince: yeni `question_version` (status=draft→in_review→published) oluşturulur, eskisi `archived`, `questions.current_version_id` yeni sürüme taşınır. **Yanlış/güncelolmayan içerik yayına çıkamaz** (Doc 2 §5).

---

### 4.3 Learning

**quiz_sessions** (bir çözüm oturumu)
| id | uuid PK |
| user_id | uuid FK |
| mode | enum(practice, exam, daily, review) |
| topic_id | uuid FK null | practice için |
| status | enum(in_progress, completed, abandoned) |
| total_questions | int |
| correct_count / wrong_count / blank_count | int |
| score | numeric null | **sunucuda hesaplanır** |
| duration_seconds | int null |
| started_at / completed_at | timestamptz |

**quiz_answers** (oturumdaki her cevap)
| id | uuid PK |
| session_id | uuid FK→quiz_sessions |
| question_id | uuid FK→questions |
| **question_version_id** | uuid FK→question_versions | **çözülen sürüm sabitlenir** |
| selected_option_id | uuid FK→question_options null | boş = null |
| is_correct | bool null |
| answered_at | timestamptz |
| time_spent_ms | int |
| UNIQUE(session_id, question_id) |

> `question_version_id` sayesinde kullanıcı bir soruyu çözdükten sonra soru güncellense bile, sonucu çözdüğü sürüme göre anlamlı kalır.

**bookmarks** (favoriler)
| user_id, question_id, created_at | UNIQUE(user_id, question_id) |

**wrong_answers** (yanlışlarım — tekrar için)
| user_id, question_id, last_wrong_at, wrong_count, resolved_at null |
| UNIQUE(user_id, question_id) | doğru çözünce resolved |

---

### 4.4 Progress & Stats

**user_topic_progress** (konu bazlı ilerleme — türetilmiş, hızlı okuma için)
| user_id, topic_id | PK bileşik |
| solved_count / correct_count | int |
| mastery | numeric (0-1) | zayıf konu tespiti için |
| last_activity_at | timestamptz |

**user_stats** (özet — tek satır/kullanıcı)
| user_id PK |
| total_solved / total_correct | int |
| total_sessions | int |
| updated_at |

**streaks**
| user_id PK |
| current_streak / longest_streak | int |
| last_active_date | date |

**daily_usage** (freemium günlük limit — Duolingo modeli)
| user_id, usage_date | PK bileşik |
| questions_answered | int |
| daily_limit | int | plandan gelir |

> Günlük limit **sunucuda** `daily_usage` üzerinden zorlanır. İstemci sayacı gösterir ama karar backend'de.

---

### 4.5 Subscription & Monetization

**plans** (abonelik planları)
| id | uuid PK |
| key | text (free, monthly, yearly) |
| name | text |
| price | numeric null |
| currency | text (TRY) |
| period | enum(none, monthly, yearly) |
| daily_question_limit | int null | free için sınır, premium null=sınırsız |
| store_product_id_ios / _android | text null | IAP ürün kimliği |
| is_active | bool |

**subscriptions** (kullanıcının abonelik durumu — sunucu doğrulamalı)
| id | uuid PK |
| user_id | uuid FK |
| plan_id | uuid FK→plans |
| provider | enum(apple, google, manual) |
| status | enum(active, expired, grace, cancelled, refunded) |
| original_transaction_id | text | Apple/Google kalıcı kimlik |
| current_period_end | timestamptz |
| auto_renew | bool |
| created_at/updated_at |

**iap_transactions** (makbuz kaydı — denetim izi)
| id | uuid PK |
| subscription_id | uuid FK null |
| user_id | uuid FK |
| provider | enum(apple, google) |
| transaction_id | text UNIQUE |
| raw_receipt | jsonb | doğrulama için ham makbuz |
| verified_at | timestamptz |
| status | enum(verified, failed) |

**entitlements** (türetilmiş erişim — hızlı kontrol)
| user_id PK |
| is_premium | bool |
| valid_until | timestamptz null |
| source_subscription_id | uuid FK null |

> Akış: İstemci StoreKit ile satın alır → makbuzu API'ye yollar → backend Apple/Google Server API ile **doğrular** → `subscriptions` + `entitlements` günceller. `SubscriptionGuard` erişimi `entitlements`'tan okur. İstemci asla premium kararı vermez.

---

### 4.6 Engagement & AI (şema kancaları)

**notifications**
| id, user_id FK, type(enum: reminder, streak, content, marketing), title, body, data jsonb, sent_at, read_at |

**daily_questions** (günlük soru — V1)
| id, question_id FK, publish_date UNIQUE, module_id FK null |

**study_plans** (AI çalışma planı — V1)
| id, user_id FK, generated_at, plan jsonb, status(active, superseded) |

**recommendations** (AI öneri)
| id, user_id FK, topic_id FK, reason, priority, created_at, consumed_at null |

> AI tabloları MVP'de boş kalır; şema kancaları şimdiden var ki V1'de migration ağrısı olmasın.

---

### 4.7 Migration (kullanıcı göçü)

**legacy_user_map** (eski→yeni eşleme)
| id | uuid PK |
| new_user_id | uuid FK→users |
| legacy_source | enum(ios_firebase, web_mysql) |
| legacy_id | text | eski sistem kimliği |
| legacy_email | citext |
| migrated_at | timestamptz |
| password_reset_required | bool | MD5 parolalar taşınamaz → true |

> **Açık nokta (Doc 8'de çözülür):** Gerçek aktif taban iOS Firebase Auth mı, web MySQL mi? MD5 parolalar güvenli taşınamayacağı için ilgili kullanıcılar ilk girişte **zorunlu şifre sıfırlama** akışına girer. Soru verisi taşınmaz (mevzuat).

---

## 5. Sürümleme Stratejisi (Derinlemesine)

**Problem:** Mevzuat değişince soru içeriği güncellenmeli, ama geçmiş sonuçlar bozulmamalı.

**Çözüm — kimlik/sürüm ayrımı:**
- `questions` = kalıcı kimlik (istatistik, favori, yanlışlarım hep buna bağlanır).
- `question_versions` = değişmez içerik sürümleri.
- `quiz_answers.question_version_id` = kullanıcının çözdüğü tam sürümü sabitler.
- Yayındaki sürüm `questions.current_version_id` ile işaret edilir.

**Sonuç:** Soru güncellense bile (a) geçmiş sonuçlar doğru sürüme bağlı anlamlı kalır, (b) "yanlışlarım" kimlik üzerinden çalışır, (c) editör onay akışı yayın kalitesini garanti eder.

---

## 6. İndeksleme & Performans

- `quiz_answers(session_id)`, `quiz_answers(question_id)` — okuma yoğun.
- `question_versions(question_id, status)` — yayındaki sürümü bulma.
- `topics(course_id)`, `courses(module_id)` — katalog gezinme.
- `daily_usage(user_id, usage_date)` — limit kontrolü (PK zaten kapsar).
- `subscriptions(user_id, status)`, `iap_transactions(transaction_id)` unique.
- Katalog okuması yoğun + nadir değişir → **API katmanında cache** (Doc 7).

## 7. Veri Bütünlüğü & Güvenlik

- Tüm FK'larda uygun `ON DELETE` kuralı (içerik: RESTRICT/soft-delete; kullanıcı verisi: CASCADE dikkatli).
- `is_correct` yalnızca `question_options`'ta; istemciye **doğru cevap sınav modunda gönderilmez** (API seçimle sızdırmaz — Doc 7).
- Supabase RLS: Doğrudan DB erişimi kapalı; erişim yalnızca NestJS servis rolü üzerinden. Son kullanıcı DB'ye hiç dokunmaz.
- Hassas alanlar (ham makbuz) yalnızca backend'de.

## 8. Migration Yönetimi
- **Prisma Migrate** ile şema versiyonlama; her değişiklik migration dosyası.
- Seed: modüller, planlar (free/monthly/yearly), roller başlangıç verisi.
- Kullanıcı göçü ayrı, tek seferlik ETL script'i (`legacy_user_map` üzerinden).
