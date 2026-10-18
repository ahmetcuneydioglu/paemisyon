/**
 * Haftalık plan üretimi (Doc 49/12 F8-A §2–3) — SAF fonksiyonlar. Zaman ve
 * veri parametreyle gelir; rastgelelik yok: aynı girdi aynı plan.
 *
 * Birimler: dakika (tam sayı), hafta başı = Pazartesi UTC günü (`common/gun.ts`
 * `haftaBasi` ile aynı anahtar).
 */

export type PlanPhase = 'build' | 'exam_mode' | 'taper';
export type PlanItemKind = 'topic' | 'review' | 'mock';

export interface PlanTopicInput {
  topicId: string;
  name: string;
  sectionId: string;
  /** Bölümün sınavdaki ağırlığı (yüzde). */
  sectionWeight: number;
  /** Konunun yayımlı soru sayısı (bölüm içi pay için). */
  publishedQuestions: number;
  /** Kullanıcı birikimi (user_topic_progress); yoksa 0. */
  solved: number;
  correct: number;
  /** 0–1; yoksa 0. */
  mastery: number;
  /** Çözülmemiş yanlış sayısı. */
  wrongCount: number;
}

export interface PlanInput {
  /** Planın ilk haftası (Pazartesi UTC). */
  startWeek: Date;
  examDate: Date | null;
  weeklyMinutes: number;
  topics: readonly PlanTopicInput[];
  isPremium: boolean;
  /** Kullanıcının ortalama cevap süresi (sn); yoksa 60. 30–120'ye kırpılır. */
  avgAnswerSeconds?: number | null;
  /** Önceki haftadan taşınan eksik dakika (konu → dakika); revizyonda dolu. */
  carryOver?: ReadonlyMap<string, number>;
}

export interface PlanItemDraft {
  kind: PlanItemKind;
  topicId: string | null;
  targetMinutes: number;
  targetQuestions: number;
}

export interface PlanWeekDraft {
  weekStart: Date;
  phase: PlanPhase;
  items: PlanItemDraft[];
}

export interface PlanDraft {
  weeks: PlanWeekDraft[];
  coverage: { topics: number; syllabusTopics: number; pctOfSyllabus: number };
}

export const UFUK_TAVAN_HAFTA = 26;
export const UFUK_VARSAYILAN_HAFTA = 12;
export const SINAV_MODU_GUN = 30;
export const TAPER_GUN = 3;
export const KALEM_TABAN_DK = 20;
/** Bir konunun tek haftadaki üst sınırı; aşan pay ikinci haftaya "pekiştirme" olur. */
export const KALEM_TAVAN_DK = 90;
export const KONU_EN_COK_HAFTA = 2;
export const SURE_EN_AZ_DK = 60;
export const SURE_EN_COK_DK = 14 * 60;
/** Haftalık süre 30 dk adımla; dışarıdan gelen değer buna yuvarlanır. */
export const SURE_ADIM_DK = 30;
export const HAFTA_MS = 7 * 86_400_000;
const GUN_MS = 86_400_000;

export function haftalikSureyiNormalize(dk: number): number {
  if (!Number.isFinite(dk)) return 5 * 60;
  const k = Math.round(dk / SURE_ADIM_DK) * SURE_ADIM_DK;
  return Math.max(SURE_EN_AZ_DK, Math.min(SURE_EN_COK_DK, k));
}

/** Onboarding'deki günlük dakika/soru hedefinden haftalık süre ön değeri (5 gün). */
export function haftalikSureOnDegeri(dailyMinutes: number | null, dailyGoal: number): number {
  if (dailyMinutes && dailyMinutes > 0) return haftalikSureyiNormalize(dailyMinutes * 5);
  const dk = dailyGoal >= 40 ? 60 : dailyGoal >= 20 ? 30 : 15;
  return haftalikSureyiNormalize(dk * 5);
}

/** Haftanın evresi, haftanın SON gününe (Pazar) kalan güne göre. */
export function haftaEvresi(weekStart: Date, examDate: Date | null): PlanPhase {
  if (!examDate) return 'build';
  const sonGun = weekStart.getTime() + 6 * GUN_MS;
  const kalan = Math.floor((examDate.getTime() - sonGun) / GUN_MS);
  if (kalan <= TAPER_GUN) return 'taper';
  if (kalan <= SINAV_MODU_GUN) return 'exam_mode';
  return 'build';
}

/** Plan ufku: başlangıç haftasından sınav haftasına (dahil); tarih yoksa 12 hafta. */
export function ufukHaftalari(startWeek: Date, examDate: Date | null): Date[] {
  let n = UFUK_VARSAYILAN_HAFTA;
  if (examDate) {
    const fark = Math.floor((examDate.getTime() - startWeek.getTime()) / HAFTA_MS) + 1;
    n = Math.max(1, Math.min(UFUK_TAVAN_HAFTA, fark));
  }
  return Array.from({ length: n }, (_, i) => new Date(startWeek.getTime() + i * HAFTA_MS));
}

/**
 * Konu puanı: bölüm payı × konunun bölüm içi payı × ihtiyaç (1.6 − mastery;
 * ≥5 yanlışta +%20). Normalize edilmiş (toplam 1). Yayımlı sorusu olmayan
 * konu plana girmez (çalışılacak şey yok).
 */
export function konuPuanlari(
  topics: readonly PlanTopicInput[],
): { topicId: string; sectionId: string; score: number }[] {
  const aday = topics.filter((t) => t.publishedQuestions > 0 && t.sectionWeight > 0);
  const bolumToplam = new Map<string, number>();
  for (const t of aday) {
    bolumToplam.set(t.sectionId, (bolumToplam.get(t.sectionId) ?? 0) + t.publishedQuestions);
  }
  const ham = aday.map((t) => {
    const bolumPayi = t.sectionWeight / 100;
    const konuPayi = t.publishedQuestions / (bolumToplam.get(t.sectionId) ?? 1);
    const mastery = Math.max(0, Math.min(1, t.mastery));
    let ihtiyac = 1.6 - mastery;
    if (t.wrongCount >= 5) ihtiyac *= 1.2;
    return { topicId: t.topicId, sectionId: t.sectionId, score: bolumPayi * konuPayi * ihtiyac };
  });
  const toplam = ham.reduce((a, b) => a + b.score, 0);
  return ham
    .map((h) => ({ ...h, score: toplam > 0 ? h.score / toplam : 0 }))
    .sort((a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId));
}

/** Dakika → soru hedefi: ortalama cevap süresiyle, 5'e yuvarlı, en az 5. */
export function soruHedefi(dakika: number, avgAnswerSeconds?: number | null): number {
  const sn = Math.max(
    30,
    Math.min(120, avgAnswerSeconds && avgAnswerSeconds > 0 ? avgAnswerSeconds : 60),
  );
  const n = Math.round((dakika * 60) / sn / 5) * 5;
  return Math.max(5, n);
}

/** Haftanın bütçe bölüşümü (dakika): evre ve premium'a göre. */
export function haftaButcesi(
  weeklyMinutes: number,
  phase: PlanPhase,
  isPremium: boolean,
): { topic: number; review: number; mock: number } {
  if (phase === 'build') return { topic: weeklyMinutes, review: 0, mock: 0 };
  if (phase === 'exam_mode') {
    if (!isPremium) return { topic: weeklyMinutes, review: 0, mock: 0 };
    const review = Math.round(weeklyMinutes * 0.3);
    const mock = Math.round(weeklyMinutes * 0.2);
    return { topic: weeklyMinutes - review - mock, review, mock };
  }
  // taper: bütçe yarıya iner; premium'da yalnız tekrar, ücretsizde hafif konu.
  const yarim = Math.round(weeklyMinutes / 2);
  return isPremium ? { topic: 0, review: yarim, mock: 0 } : { topic: yarim, review: 0, mock: 0 };
}

/**
 * Su doldurma: toplam dakika puan oranında dağıtılır; tavanı (2 × 90) aşanlar
 * tavana kırpılır ve artan, kalanlara yeniden dağıtılır; tabanın (20) altında
 * kalanlar düşer ve payları yine dağıtılır. Böylece bütçe boşa gitmez ve kapsam,
 * bütçenin gerçekten izin verdiği kadar geniş olur. Deterministik.
 */
export function dakikaDagit(
  konular: readonly { topicId: string; score: number; ek: number }[],
  toplamDk: number,
  tavan: number = KALEM_TAVAN_DK * KONU_EN_COK_HAFTA,
): Map<string, number> {
  let aktif = konular.filter((k) => k.score > 0);
  const sonuc = new Map<string, number>();
  // Taşınan dakika bütçenin İÇİNDEN gelir (haftalık süre sabittir): payı
  // dağıtmadan önce düşülür, sonra konusuna eklenir.
  let kalan = toplamDk - aktif.reduce((a, k) => a + k.ek, 0);
  for (let tur = 0; tur < 100 && aktif.length > 0 && kalan > 0; tur++) {
    const puanToplam = aktif.reduce((a, k) => a + k.score, 0);
    const taslak = aktif.map((k) => ({ k, dk: Math.round((kalan * k.score) / puanToplam) + k.ek }));
    const tavanAsan = taslak.filter((t) => t.dk > tavan);
    const tabanAlti = taslak.filter((t) => t.dk < KALEM_TABAN_DK);
    if (tavanAsan.length === 0 && tabanAlti.length === 0) {
      for (const t of taslak) sonuc.set(t.k.topicId, Math.round(t.dk / 5) * 5);
      return sonuc;
    }
    if (tavanAsan.length) {
      for (const t of tavanAsan) {
        sonuc.set(t.k.topicId, tavan);
        kalan -= tavan - t.k.ek;
      }
      const sabit = new Set(tavanAsan.map((t) => t.k.topicId));
      aktif = aktif.filter((k) => !sabit.has(k.topicId));
      continue;
    }
    // Yalnız taban altı kalanlar var: en düşük puanlı yarısını düşür, yeniden dağıt
    // (teker teker düşürmek onlarca tur sürer; yarı yarıya düşürmek aynı sonuca yakınsar).
    const dusecek = [...tabanAlti]
      .sort((a, b) => a.k.score - b.k.score || a.k.topicId.localeCompare(b.k.topicId))
      .slice(0, Math.ceil(tabanAlti.length / 2))
      .map((t) => t.k.topicId);
    const dusen = new Set(dusecek);
    aktif = aktif.filter((k) => !dusen.has(k.topicId));
  }
  // Son tur: kalan aktifler oranla alır.
  const puanToplam = aktif.reduce((a, k) => a + k.score, 0);
  for (const k of aktif) {
    sonuc.set(k.topicId, Math.round(((kalan * k.score) / (puanToplam || 1) + k.ek) / 5) * 5);
  }
  return sonuc;
}

interface Parca {
  topicId: string;
  sectionId: string;
  score: number;
  dk: number;
}

/**
 * Plan üretimi. Konu dakikaları ufuktaki toplam konu bütçesine puan oranında
 * dağıtılır; 20 dk altı düşer, 90 dk üstü ikiye bölünür (en çok 2 hafta).
 * Parçalar puan sırasıyla, her haftaya aynı bölümden tekrar koymamayı
 * yeğleyerek, en az dolu haftaya yerleşir. Aynı konunun iki parçası aynı
 * haftaya gelmez.
 */
export function planUret(input: PlanInput): PlanDraft {
  const weeklyMinutes = haftalikSureyiNormalize(input.weeklyMinutes);
  const haftalar = ufukHaftalari(input.startWeek, input.examDate);
  const evreler = haftalar.map((w) => haftaEvresi(w, input.examDate));
  const butceler = evreler.map((e) => haftaButcesi(weeklyMinutes, e, input.isPremium));
  const toplamKonuDk = butceler.reduce((a, b) => a + b.topic, 0);

  const puanlar = konuPuanlari(input.topics);
  // Parça tavanı haftalık konu bütçesini aşamaz (60 dk/hafta planında 90 dk'lık kalem olmaz).
  const parcaTavan = Math.max(
    KALEM_TABAN_DK,
    Math.min(KALEM_TAVAN_DK, Math.max(0, ...butceler.map((b) => b.topic))),
  );
  const dagilim = dakikaDagit(
    puanlar.map((p) => ({
      topicId: p.topicId,
      score: p.score,
      ek: input.carryOver?.get(p.topicId) ?? 0,
    })),
    toplamKonuDk,
    parcaTavan * KONU_EN_COK_HAFTA,
  );
  const parcalar: Parca[] = [];
  const yerlesenKonular = new Set<string>();
  for (const p of puanlar) {
    const dk = dagilim.get(p.topicId) ?? 0;
    if (dk < KALEM_TABAN_DK) continue;
    if (dk > parcaTavan) {
      const ilk = Math.ceil(dk / 2 / 5) * 5;
      parcalar.push({ ...p, dk: ilk }, { ...p, dk: dk - ilk });
    } else {
      parcalar.push({ ...p, dk });
    }
  }

  const yuk = butceler.map(() => 0);
  const haftaKonulari = butceler.map(() => new Set<string>());
  const haftaBolumleri = butceler.map(() => new Map<string, number>());
  const kalemler: PlanItemDraft[][] = butceler.map(() => []);

  for (let parca of parcalar) {
    let secim = -1;
    let enIyi = Number.POSITIVE_INFINITY;
    for (let i = 0; i < haftalar.length; i++) {
      const kapasite = butceler[i].topic;
      if (kapasite <= 0 || haftaKonulari[i].has(parca.topicId)) continue;
      if (yuk[i] + parca.dk > kapasite) continue;
      // Aynı bölüm o haftada varsa ceza: haftalar derse boğulmasın.
      const bolumSayisi = haftaBolumleri[i].get(parca.sectionId) ?? 0;
      const maliyet = yuk[i] / kapasite + bolumSayisi * 0.35 + i * 0.001;
      if (maliyet < enIyi) {
        enIyi = maliyet;
        secim = i;
      }
    }
    if (secim < 0) {
      // Bütün olarak sığmıyor: en büyük boşluğa kırpılarak girer (≥ taban), kalanı düşer.
      let enBos = -1;
      let bos = 0;
      for (let i = 0; i < haftalar.length; i++) {
        const kalan = butceler[i].topic - yuk[i];
        if (!haftaKonulari[i].has(parca.topicId) && kalan > bos) {
          bos = kalan;
          enBos = i;
        }
      }
      if (enBos < 0 || bos < KALEM_TABAN_DK) continue;
      parca = { ...parca, dk: Math.floor(bos / 5) * 5 };
      secim = enBos;
    }
    yuk[secim] += parca.dk;
    yerlesenKonular.add(parca.topicId);
    haftaKonulari[secim].add(parca.topicId);
    haftaBolumleri[secim].set(
      parca.sectionId,
      (haftaBolumleri[secim].get(parca.sectionId) ?? 0) + 1,
    );
    kalemler[secim].push({
      kind: 'topic',
      topicId: parca.topicId,
      targetMinutes: parca.dk,
      targetQuestions: soruHedefi(parca.dk, input.avgAnswerSeconds),
    });
  }

  const weeks: PlanWeekDraft[] = haftalar.map((weekStart, i) => {
    const items = [...kalemler[i]].sort(
      (a, b) =>
        b.targetMinutes - a.targetMinutes || (a.topicId ?? '').localeCompare(b.topicId ?? ''),
    );
    const b = butceler[i];
    if (b.review > 0) {
      items.push({
        kind: 'review',
        topicId: null,
        targetMinutes: b.review,
        targetQuestions: soruHedefi(b.review, input.avgAnswerSeconds),
      });
    }
    if (b.mock > 0) {
      items.push({ kind: 'mock', topicId: null, targetMinutes: b.mock, targetQuestions: 0 });
    }
    return { weekStart, phase: evreler[i], items };
  });

  const syllabusTopics = input.topics.filter((t) => t.publishedQuestions > 0).length;
  return {
    weeks,
    coverage: {
      topics: yerlesenKonular.size,
      syllabusTopics,
      pctOfSyllabus:
        syllabusTopics > 0 ? Math.round((yerlesenKonular.size / syllabusTopics) * 100) : 0,
    },
  };
}

export interface KalemDurumu {
  targetMinutes: number;
  targetQuestions: number;
  doneMinutes: number;
  doneQuestions: number;
}

/** Kalem tamamlandı mı: soru VEYA dakika hedefinin tamamı (hedefi 0 olan ölçü sayılmaz). */
export function kalemBittiMi(k: KalemDurumu): boolean {
  const soru = k.targetQuestions > 0 && k.doneQuestions >= k.targetQuestions;
  const dk = k.targetMinutes > 0 && k.doneMinutes >= k.targetMinutes;
  return soru || dk;
}

/**
 * Hafta kapanışı: bitmemiş kalemlerin eksik dakikasının yarısı sonraki haftaya
 * taşınır (yalnız konu kalemleri; premium — ücretsizde revizyon yok, taşıma da
 * yok). Dönüş: konu → taşınacak dakika.
 */
export function haftaKapanisiTasimasi(
  items: readonly (KalemDurumu & { kind: PlanItemKind; topicId: string | null })[],
  isPremium: boolean,
): Map<string, number> {
  const tasima = new Map<string, number>();
  if (!isPremium) return tasima;
  for (const k of items) {
    if (k.kind !== 'topic' || !k.topicId || kalemBittiMi(k)) continue;
    const eksik = Math.max(0, k.targetMinutes - k.doneMinutes);
    const yarim = Math.round(eksik / 2 / 5) * 5;
    if (yarim >= 5) tasima.set(k.topicId, (tasima.get(k.topicId) ?? 0) + yarim);
  }
  return tasima;
}

/** Haftalık özet (istemci metinleri bundan kurulur). */
export function haftaOzeti(items: readonly KalemDurumu[]) {
  const t = items.reduce(
    (a, k) => ({
      targetMinutes: a.targetMinutes + k.targetMinutes,
      doneMinutes: a.doneMinutes + k.doneMinutes,
      targetQuestions: a.targetQuestions + k.targetQuestions,
      doneQuestions: a.doneQuestions + k.doneQuestions,
    }),
    { targetMinutes: 0, doneMinutes: 0, targetQuestions: 0, doneQuestions: 0 },
  );
  const pct =
    t.targetMinutes > 0
      ? Math.min(
          100,
          Math.round((Math.min(t.doneMinutes, t.targetMinutes) / t.targetMinutes) * 100),
        )
      : 0;
  return { ...t, pct };
}
