import { AZ_VERI_ESIGI, ZAYIF_DOGRULUK_ESIGI, enZayifKonular } from '../../common/zayif-konu';
import type { Readiness, ReadinessCourse, ReadinessTopic } from './home-v2.types';

/** Kullanıcının bir konudaki birikimi (user_topic_progress + konu/ders adı). */
export interface KonuIlerlemesi {
  topicId: string;
  topicName: string;
  courseId: string;
  courseName: string;
  solved: number;
  correct: number;
}

/**
 * Hazırlık bloğu (Doc 48 §3 ③) — SAF fonksiyon.
 *
 * Bileşik "hazır %" skoru üretilmez (Doc 48 İ6): ders başına yalnız ölçülebilir
 * olan — çözülen soru ve doğru oranı — ve tek eşikli en zayıf 3 konu.
 *
 * @param courses hedef sınavın dersleri, müfredat sırasıyla; hedef seçilmemişse
 *   null (ders listesi boş döner, en zayıf konular tüm birikimden seçilir).
 */
export function buildReadiness(input: {
  courses: { courseId: string; name: string }[] | null;
  progress: readonly KonuIlerlemesi[];
  weeklyPhoto: readonly { courseName: string; deltaPct: number }[];
  unresolvedWrongCount: number;
}): Readiness {
  const { courses, progress } = input;
  const kapsam = courses ? new Set(courses.map((c) => c.courseId)) : null;
  const kapsamdaki = kapsam ? progress.filter((p) => kapsam.has(p.courseId)) : progress;

  const dersler: ReadinessCourse[] = (courses ?? []).map((c) => {
    let solved = 0;
    let correct = 0;
    for (const p of kapsamdaki) {
      if (p.courseId !== c.courseId) continue;
      solved += p.solved;
      correct += p.correct;
    }
    const accuracy = solved > 0 ? correct / solved : null;
    const state =
      solved < AZ_VERI_ESIGI ? 'sparse' : accuracy! < ZAYIF_DOGRULUK_ESIGI ? 'weak' : 'normal';
    const delta = input.weeklyPhoto.find((w) => w.courseName === c.name);
    return {
      courseId: c.courseId,
      name: c.name,
      solved,
      correct,
      accuracy,
      state,
      deltaPct: delta ? delta.deltaPct : null,
    };
  });

  const weakest: ReadinessTopic[] = enZayifKonular(
    kapsamdaki.map((p) => ({ ...p, accuracy: p.solved > 0 ? p.correct / p.solved : 0 })),
    3,
  ).map((p) => ({
    topicId: p.topicId,
    name: p.topicName,
    courseName: p.courseName,
    accuracy: p.accuracy,
    solved: p.solved,
  }));

  return { courses: dersler, weakest, unresolvedWrongCount: input.unresolvedWrongCount };
}
