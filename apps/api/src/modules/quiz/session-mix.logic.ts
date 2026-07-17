/**
 * "Bugün Çalış" karışım motoru (Doc 24 §9, Doc 25 §5) — SAF mantık, birim testli.
 *
 * Normal reçete:  ~%40 zayıf konu + ~%25 yanlış tekrarı + ~%35 yeni/karışık.
 * Sınav modunda (sınava ≤30 gün) TERSİNE döner (Doc 24 §1/150. gün):
 * yeni konu durur → ~%50 yanlış tekrarı + ~%30 zayıf + ~%20 karışık pekiştirme.
 *
 * "Neye bakılacağını koç seçer": kotalar havuz yetersizse kalan dilimlere
 * devredilir — seans HER ZAMAN istenen sayıda soruyla dolar (havuz yettiğince).
 */

export interface MixQuota {
  wrong: number;
  weak: number;
  fresh: number;
}

export interface MixPools<T extends { id: string; topicId: string } = { id: string; topicId: string }> {
  /** Havuzdaki tüm sorular (yayında + premium filtresi uygulanmış). */
  pool: T[];
  /** Kullanıcının çözülmemiş yanlış soruları (id seti). */
  wrongIds: ReadonlySet<string>;
  /** Zayıf konular (mastery düşük) — id seti. */
  weakTopicIds: ReadonlySet<string>;
  /** Çok çalışılmış konular (yeni dilimi bunlardan KAÇINIR) — id seti. */
  heavyTopicIds: ReadonlySet<string>;
}

/** Kota hesabı: toplam = count garanti (yuvarlama artığı fresh'e yazılır). */
export function mixQuota(count: number, examMode: boolean): MixQuota {
  const wrong = Math.round(count * (examMode ? 0.5 : 0.25));
  const weak = Math.round(count * (examMode ? 0.3 : 0.4));
  return { wrong, weak, fresh: Math.max(0, count - wrong - weak) };
}

/**
 * Karışımı seçer. `shuffle` dışarıdan verilir (testte deterministik).
 * Dilim öncelikleri: yanlış → zayıf → yeni; açık kalan yer sırayla devredilir.
 */
export function pickMix<T extends { id: string; topicId: string }>(
  count: number,
  pools: MixPools<T>,
  quota: MixQuota,
  shuffle: <U>(a: U[]) => U[],
): T[] {
  const chosen: T[] = [];
  const used = new Set<string>();
  const take = (candidates: T[], n: number) => {
    for (const q of shuffle([...candidates])) {
      if (chosen.length >= count) break;
      if (n <= 0) break;
      if (used.has(q.id)) continue;
      used.add(q.id);
      chosen.push(q);
      n--;
    }
  };

  // 1) Yanlış tekrarı — öğrenme döngüsünün kalbi (yanıl → anla → tekrar).
  take(pools.pool.filter((q) => pools.wrongIds.has(q.id)), quota.wrong);

  // 2) Zayıf konular.
  const weakRemaining = quota.wrong + quota.weak - chosen.length;
  take(pools.pool.filter((q) => pools.weakTopicIds.has(q.topicId)), weakRemaining);

  // 3) Yeni/karışık — hem çok çalışılmış hem zayıf konulardan kaçınır
  //    (zayıf dilim kendi kotasını aldı; "yeni" gerçekten yeni olmalı).
  take(
    pools.pool.filter(
      (q) => !pools.heavyTopicIds.has(q.topicId) && !pools.weakTopicIds.has(q.topicId),
    ),
    count - chosen.length,
  );
  take(pools.pool, count - chosen.length); // son çare: havuzdan doldur

  return chosen;
}
