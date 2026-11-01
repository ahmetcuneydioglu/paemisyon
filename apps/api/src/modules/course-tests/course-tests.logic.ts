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
  /** En iyi tamamlanmış oturum (eşitlikte en yeni): yüzde, doğru, yanlış; yoksa null. */
  best: { pct: number; correct: number; wrong: number } | null;
  /** Yarım oturum: cevap sayısı ve oturum kimliği. */
  inProgress: { sessionId: string; answered: number; total: number } | null;
}

export function testDurumu(t: TestSatiri, isPremium: boolean): TestDurumu {
  if (!isPremium && t.number > UCRETSIZ_TEST_SAYISI) return 'locked';
  if (t.inProgress) return 'progress';
  if (t.best != null) return 'done';
  return 'new';
}

export interface TestKarti {
  id: string;
  number: number;
  questionCount: number;
  state: TestDurumu;
  /** Tamamlandıysa en iyi denemenin yüzdesi, doğru ve yanlış sayısı. */
  pct: number | null;
  correct: number | null;
  wrong: number | null;
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
      pct: state === 'done' ? r.best!.pct : null,
      correct: state === 'done' ? r.best!.correct : null,
      wrong: state === 'done' ? r.best!.wrong : null,
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

/**
 * Sayının yönelme eki, okunuşuna göre: 2'ye, 3'e, 6'ya, 9'a, 10'a, 20'ye, 50'ye, 100'e.
 * Son sıfır olmayan basamak okunuşu belirler; tam onlarda onluğun adı, tam yüz/binlerde "yüz/bin".
 */
export function yonelmeEki(n: number): string {
  const birler: Record<number, string> = {
    1: 'e',
    2: 'ye',
    3: 'e',
    4: 'e',
    5: 'e',
    6: 'ya',
    7: 'ye',
    8: 'e',
    9: 'a',
  };
  const onlar: Record<number, string> = {
    1: 'a',
    2: 'ye',
    3: 'a',
    4: 'a',
    5: 'ye',
    6: 'a',
    7: 'e',
    8: 'e',
    9: 'a',
  };
  const m = Math.abs(Math.trunc(n));
  if (m % 10 !== 0) return birler[m % 10]!;
  if (m % 100 !== 0) return onlar[(m / 10) % 10]!;
  return 'e'; // yüz, bin; sıfır ("sıfıra") testlerde geçmez
}

/** "Test 4'e" — düğme ve cümlelerde tek kaynak. */
export const testeDogru = (n: number) => `Test ${n}'${yonelmeEki(n)}`;

/** Test sonucunda "önce yanlışları çöz" eşiği (yüzde): altında sıradaki teste itilmez. */
export const ZAYIF_TEST_ESIGI = 50;

export type SonucOnceligi = 'next' | 'wrongs' | 'review';

/**
 * Test sonucu ekranının birincil eylemi (Doc 49/18 §8): zayıf geçen testte önce yanlışlar;
 * değilse sıradaki AÇIK test; sıradaki yoksa ya da kilitliyse yanlışlar, o da yoksa inceleme.
 */
export function sonucOnceligi(input: {
  pct: number;
  wrong: number;
  next: { locked: boolean } | null;
}): SonucOnceligi {
  if (input.wrong > 0 && input.pct < ZAYIF_TEST_ESIGI) return 'wrongs';
  if (input.next && !input.next.locked) return 'next';
  return input.wrong > 0 ? 'wrongs' : 'review';
}

/** Sonuç ekranının tek koç cümlesi — sıfat yok, bir sonraki adım var (Doc 26 §1). */
export function sonucCumlesi(input: {
  number: number;
  pct: number;
  wrong: number;
  next: { number: number; locked: boolean } | null;
}): string {
  const { wrong, next } = input;
  const sonraki = next ? `Test ${next.number}` : null;
  if (!next)
    return wrong > 0
      ? `Dersin son testi buydu; ${wrong} yanlışını bir tur daha çöz.`
      : 'Dersin son testi buydu — hepsi doğru.';
  if (wrong > 0 && input.pct < ZAYIF_TEST_ESIGI)
    return `${testeDogru(next.number)} geçmeden önce ${wrong} yanlışını bir tur daha çöz.`;
  if (next.locked)
    return wrong > 0
      ? `${wrong} yanlışını çözerek pekiştir; ${sonraki} Premium'da.`
      : `Hepsi doğru; ${sonraki} Premium'da.`;
  return wrong > 0
    ? `${wrong} yanlışına göz at; ${sonraki} seni bekliyor.`
    : `Hepsi doğru; ${sonraki} seni bekliyor.`;
}
