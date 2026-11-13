/**
 * Zamanlanmış görevler (cron) yalnız CANLI sunucuda çalışır (13 Kas 2026).
 *
 * Neden: 28 Eki 2026'da unutulmuş bir yerel API, `.env` ile canlı veritabanına bağlıyken kendi
 * eski kodunun "süresi dolan oturumu kapat" cron'unu çalıştırdı; Paem11 Deneme-1'de 13 oturum
 * süre dolmadan kapandı, puanlar 0/eksi göründü. Yerel süreç cron'u hiç başlatmazsa bu olamaz.
 *
 * Kural:
 *  - `CRON_ENABLED=1` → açık, `CRON_ENABLED=0` → kapalı (açık ayar her şeyi ezer; yerel E2E/prova
 *    bilerek açar).
 *  - Ayar yoksa: Railway'de (platformun kendiliğinden verdiği RAILWAY_* değişkenleri) açık, başka her
 *    yerde (Mac, worktree, betik) kapalı.
 */
export function zamanlanmisGorevlerAcik(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.CRON_ENABLED === '1') return true;
  if (env.CRON_ENABLED === '0') return false;
  return Boolean(env.RAILWAY_ENVIRONMENT_NAME || env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID);
}
