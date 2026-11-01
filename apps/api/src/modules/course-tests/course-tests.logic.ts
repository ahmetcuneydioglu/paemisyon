/**
 * Ders testleri saf mantığı (Doc 49/18). Atama kararlıdır: mevcut testler değişmez, yeni sorular
 * son testi TEST_BOYU'na tamamlar, sonra yeni test açar. Durum ve bölümleme sunucuda; istemci
 * yalnız çizer.
 */
export const TEST_BOYU = 20;
/** Ücretsiz planda açık testlerin üst sınırı (kullanıcı kararı: yalnız Test 1). */
export const UCRETSIZ_TEST_SAYISI = 1;

export interface AtamaPlani {
  /** Son teste eklenecek sorular (konum sırasıyla). */
  sonaEkle: { testNumber: number; startPosition: number; questionIds: string[] } | null;
  /** Açılacak yeni testler. */
  yeniTestler: { number: number; questionIds: string[] }[];
}

/**
 * @param son Dersin son testi (numara ve şu anki soru sayısı); hiç test yoksa null.
 * @param yeniler Henüz atanmamış sorular, konu sırasıyla dizilmiş.
 */
export function atamaPlani(
  son: { number: number; count: number } | null,
  yeniler: readonly string[],
  boy = TEST_BOYU,
): AtamaPlani {
  let kalan = [...yeniler];
  let sonaEkle: AtamaPlani['sonaEkle'] = null;
  if (son && son.count < boy && kalan.length > 0) {
    const bos = boy - son.count;
    sonaEkle = {
      testNumber: son.number,
      startPosition: son.count,
      questionIds: kalan.slice(0, bos),
    };
    kalan = kalan.slice(bos);
  }
  const yeniTestler: AtamaPlani['yeniTestler'] = [];
  let numara = son?.number ?? 0;
  for (let i = 0; i < kalan.length; i += boy) {
    numara += 1;
    yeniTestler.push({ number: numara, questionIds: kalan.slice(i, i + boy) });
  }
  return { sonaEkle, yeniTestler };
}

/** Konu ağacını düz sıraya çevirir: üst konu sortOrder'ı, hemen ardından çocukları. */
export function konuSirasi(
  topics: readonly { id: string; parentId: string | null; sortOrder: number }[],
): Map<string, number> {
  const byParent = new Map<string | null, (typeof topics)[number][]>();
  for (const t of topics) {
    const k = t.parentId;
    byParent.set(k, [...(byParent.get(k) ?? []), t]);
  }
  const sirala = (xs: readonly (typeof topics)[number][]) =>
    [...xs].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const out = new Map<string, number>();
  const gez = (parent: string | null) => {
    for (const t of sirala(byParent.get(parent) ?? [])) {
      out.set(t.id, out.size);
      gez(t.id);
    }
  };
  gez(null);
  // Ağaca bağlanamayan (üstü dersin dışında) konular sona.
  for (const t of sirala(topics)) if (!out.has(t.id)) out.set(t.id, out.size);
  return out;
}

export type TestDurumu = 'done' | 'progress' | 'new' | 'locked';

export interface TestSatiri {
  id: string;
  number: number;
  topicId: string | null;
  topicName: string | null;
  questionCount: number;
  /** En iyi tamamlanmış oturumun yüzdesi; yoksa null. */
  bestPct: number | null;
  /** Yarım oturum: cevap sayısı ve oturum kimliği. */
  inProgress: { sessionId: string; answered: number; total: number } | null;
}

export function testDurumu(t: TestSatiri, isPremium: boolean): TestDurumu {
  if (!isPremium && t.number > UCRETSIZ_TEST_SAYISI) return 'locked';
  if (t.inProgress) return 'progress';
  if (t.bestPct != null) return 'done';
  return 'new';
}

export interface TestKarti {
  id: string;
  number: number;
  questionCount: number;
  state: TestDurumu;
  pct: number | null;
  answered: number | null;
  sessionId: string | null;
}

export interface TestBolumu {
  heading: string;
  from: number;
  to: number;
  tests: TestKarti[];
}

/** Aynı başlık konusuna sahip ARDIŞIK testler bir bölümdür ("T.C. Anayasası · Test 5–24"). */
export function bolumle(rows: readonly TestSatiri[], isPremium: boolean): TestBolumu[] {
  const out: TestBolumu[] = [];
  let anahtar: string | null | undefined;
  for (const r of [...rows].sort((a, b) => a.number - b.number)) {
    const state = testDurumu(r, isPremium);
    const kart: TestKarti = {
      id: r.id,
      number: r.number,
      questionCount: r.questionCount,
      state,
      pct: state === 'done' ? r.bestPct : null,
      answered: state === 'progress' ? r.inProgress!.answered : null,
      sessionId: state === 'progress' ? r.inProgress!.sessionId : null,
    };
    const son = out[out.length - 1];
    if (son && anahtar === r.topicId) {
      son.tests.push(kart);
      son.to = r.number;
    } else {
      out.push({ heading: r.topicName ?? 'Karışık', from: r.number, to: r.number, tests: [kart] });
      anahtar = r.topicId;
    }
  }
  return out;
}

/** Sıradaki test: önce yarım olan, yoksa açık ve bitmemiş ilk test. */
export function siradaki(rows: readonly TestSatiri[], isPremium: boolean) {
  const sirali = [...rows].sort((a, b) => a.number - b.number);
  const yarim = sirali.find((r) => testDurumu(r, isPremium) === 'progress');
  if (yarim)
    return {
      testId: yarim.id,
      number: yarim.number,
      heading: yarim.topicName,
      answered: yarim.inProgress!.answered,
      total: yarim.inProgress!.total,
      sessionId: yarim.inProgress!.sessionId,
    };
  const yeni = sirali.find((r) => testDurumu(r, isPremium) === 'new');
  return yeni
    ? {
        testId: yeni.id,
        number: yeni.number,
        heading: yeni.topicName,
        answered: 0,
        total: yeni.questionCount,
        sessionId: null,
      }
    : null;
}
