import { enGucluKonular, enZayifKonular, zayifMi } from '../../common/zayif-konu';
import { buildReadiness, KonuIlerlemesi } from './readiness.logic';

const konu = (over: Partial<KonuIlerlemesi> & { topicId: string }): KonuIlerlemesi => ({
  topicName: over.topicId,
  courseId: 'anayasa',
  courseName: 'Anayasa Hukuku',
  solved: 20,
  correct: 15,
  ...over,
});

describe('zayıf konu — tek eşik (≥10 çözülmüş ve < %60)', () => {
  it('eşik sınırları', () => {
    expect(zayifMi(9, 0.1)).toBe(false); // az veri: yargı yok
    expect(zayifMi(10, 0.59)).toBe(true);
    expect(zayifMi(10, 0.6)).toBe(false); // tam eşik zayıf değil
  });

  it('en düşük doğruluk önce; eşitlikte daha çok çözülen önce; limit', () => {
    const rows = [
      { id: 'a', solved: 10, accuracy: 0.5 },
      { id: 'b', solved: 30, accuracy: 0.5 },
      { id: 'c', solved: 12, accuracy: 0.3 },
      { id: 'd', solved: 50, accuracy: 0.9 },
    ];
    expect(enZayifKonular(rows, 2).map((r) => r.id)).toEqual(['c', 'b']);
  });
});

describe('güçlü konu — dönüş reçetesi kaynağı (≥10 çözülmüş ve ≥ %70)', () => {
  it('eşik ve sıralama', () => {
    const rows = [
      { id: 'a', solved: 9, accuracy: 0.95 }, // az veri
      { id: 'b', solved: 20, accuracy: 0.7 }, // tam eşik güçlü
      { id: 'c', solved: 12, accuracy: 0.9 },
      { id: 'd', solved: 40, accuracy: 0.69 },
    ];
    expect(enGucluKonular(rows, 3).map((r) => r.id)).toEqual(['c', 'b']);
  });
});

describe('buildReadiness — hazırlık bloğu (Doc 48 §3 ③)', () => {
  const courses = [
    { courseId: 'anayasa', name: 'Anayasa Hukuku', icon: 'landmark' },
    { courseId: 'cmk', name: 'Ceza Muhakemesi Hukuku', icon: 'scale' },
    { courseId: 'ata', name: 'Atatürk İlkeleri ve İnkılap Tarihi', icon: null },
  ];

  it('ders bazında çözülen + doğru oranı ve durum (zayıf / az veri / normal)', () => {
    const r = buildReadiness({
      courses,
      progress: [
        konu({ topicId: 'temel-haklar', solved: 26, correct: 10 }),
        konu({ topicId: 'yurutme', solved: 18, correct: 8 }),
        konu({ topicId: 'tutuklama', courseId: 'cmk', courseName: 'Ceza Muhakemesi Hukuku', solved: 40, correct: 30 }),
        konu({ topicId: 'inkilap', courseId: 'ata', courseName: 'Atatürk İlkeleri ve İnkılap Tarihi', solved: 3, correct: 1 }),
      ],
      weeklyPhoto: [{ courseName: 'Anayasa Hukuku', deltaPct: 4 }],
      unresolvedWrongCount: 4,
    });
    expect(r.courses.map((c) => [c.courseId, c.solved, c.state])).toEqual([
      ['anayasa', 44, 'weak'],
      ['cmk', 40, 'normal'],
      ['ata', 3, 'sparse'],
    ]);
    expect(r.courses[0].accuracy).toBeCloseTo(18 / 44);
    expect(r.courses[0].deltaPct).toBe(4);
    expect(r.courses[1].deltaPct).toBeNull();
    expect(r.unresolvedWrongCount).toBe(4);
  });

  it('ders ikonu veriden aynen geçer; atanmamış ikon null kalır (istemci açık kitap çizer)', () => {
    // İkon panelden yönetilir (Doc 48 Faz 6.3): sunucu varsayılan uydurmaz,
    // birikim olsun olmasın her derste aynı değer döner.
    const r = buildReadiness({
      courses,
      progress: [konu({ topicId: 'temel-haklar', solved: 26, correct: 10 })],
      weeklyPhoto: [],
      unresolvedWrongCount: 0,
    });
    expect(r.courses.map((c) => [c.courseId, c.icon])).toEqual([
      ['anayasa', 'landmark'],
      ['cmk', 'scale'],
      ['ata', null],
    ]);
  });

  it('hiç çözülmemiş ders: doğruluk null, durum az veri — sıfır yerine dürüst boşluk', () => {
    const r = buildReadiness({ courses, progress: [], weeklyPhoto: [], unresolvedWrongCount: 0 });
    expect(r.courses.every((c) => c.accuracy === null && c.state === 'sparse')).toBe(true);
    expect(r.weakest).toEqual([]);
  });

  it('en zayıf 3 konu yalnız hedef sınavın derslerinden ve tek eşikle', () => {
    const r = buildReadiness({
      courses: courses.slice(0, 2),
      progress: [
        konu({ topicId: 'temel-haklar', solved: 26, correct: 10 }), // %38
        konu({ topicId: 'yurutme', solved: 18, correct: 8 }), // %44
        konu({ topicId: 'yasama', solved: 16, correct: 9 }), // %56
        konu({ topicId: 'yargi', solved: 14, correct: 9 }), // %64 — zayıf değil
        konu({ topicId: 'az-veri', solved: 9, correct: 0 }), // az veri — zayıf değil
        konu({ topicId: 'kapsam-disi', courseId: 'misyon', courseName: 'Misyon', solved: 30, correct: 3 }),
      ],
      weeklyPhoto: [],
      unresolvedWrongCount: 0,
    });
    expect(r.weakest.map((t) => t.topicId)).toEqual(['temel-haklar', 'yurutme', 'yasama']);
    expect(r.weakest[0]).toMatchObject({ courseName: 'Anayasa Hukuku', solved: 26 });
  });

  it('hedef sınav seçilmemiş: ders listesi boş, zayıf konular tüm birikimden', () => {
    const r = buildReadiness({
      courses: null,
      progress: [konu({ topicId: 'misyon-konu', courseId: 'misyon', courseName: 'Misyon', solved: 20, correct: 5 })],
      weeklyPhoto: [],
      unresolvedWrongCount: 0,
    });
    expect(r.courses).toEqual([]);
    expect(r.weakest.map((t) => t.topicId)).toEqual(['misyon-konu']);
  });
});
