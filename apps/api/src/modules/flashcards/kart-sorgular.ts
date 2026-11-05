import type { PrismaClient } from '@prisma/client';
import { gunBaslangici } from '../../common/gun';
import { FLASHCARDS_ENABLED_DEFAULT, SETTING_KEYS } from '../../infra/settings/settings.service';
import { flashcardsAcik } from './flashcard.constants';
import { dailyDone } from './flashcards.logic';

/**
 * Doc 56 — kart sayım sorguları. Servis (koç, Çalış, istatistik) ve bildirim preset'i aynı sorguyu
 * kullanır; kural tek yerde: kilitli kart (premium kapısı) ücretsiz kullanıcıya sayılmaz, geri alınmış
 * olay sayılmaz, "bugün" uygulama günüdür (TR 04.00).
 */
type Db = Pick<
  PrismaClient,
  'flashcardReview' | 'flashcardReviewEvent' | 'appSetting' | 'userRole'
>;

/** Kapı: bayrak açık ya da kullanıcı admin/beta (`flashcardsAcik` ile aynı kural; SettingsService önbelleği dışında). */
export async function flashcardsEnabledFor(db: Db, userId: string): Promise<boolean> {
  const [setting, roles] = await Promise.all([
    db.appSetting.findUnique({ where: { key: SETTING_KEYS.flashcardsEnabled } }),
    db.userRole.findMany({ where: { userId }, select: { role: { select: { key: true } } } }),
  ]);
  const v = setting?.value;
  const acik = v == null ? FLASHCARDS_ENABLED_DEFAULT : v === 'true' || v === '1';
  return flashcardsAcik(
    acik,
    roles.map((r) => r.role.key),
  );
}

/** Vadesi gelen, yayındaki, kullanıcının açabildiği kart sayısı (tüm dersler). */
export async function countDueCards(
  db: Db,
  userId: string,
  isPremium: boolean,
  now: Date,
): Promise<number> {
  const due = await db.flashcardReview.findMany({
    where: { userId, dueAt: { lte: now }, flashcard: { status: 'published', deletedAt: null } },
    select: {
      flashcard: {
        select: {
          topic: { select: { isPremium: true } },
          summaryUnit: { select: { isPremium: true } },
        },
      },
    },
  });
  if (isPremium) return due.length;
  return due.filter((d) => !(d.flashcard.summaryUnit?.isPremium ?? d.flashcard.topic.isPremium))
    .length;
}

/** Bugün çalışılan tekil kart sayısı (geri alınmamış olaylar; günlük hedefle aynı sayım). */
export async function countReviewedToday(db: Db, userId: string, now: Date): Promise<number> {
  const events = await db.flashcardReviewEvent.findMany({
    where: { userId, reviewedAt: { gte: gunBaslangici(now) } },
    select: { flashcardId: true, rating: true, undoneAt: true },
  });
  return dailyDone(events);
}
