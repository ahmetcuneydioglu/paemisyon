import { CoachRule } from '../coach.types';
import { badgeNearRule } from './badge-near.rule';
import { comebackRule } from './comeback.rule';
import { examModeRule } from './exam-mode.rule';
import { slumpWatchRule } from './slump-watch.rule';
import { taperRule } from './taper.rule';
import { courseTrendRule } from './course-trend.rule';
import { dailyQuizRule } from './daily-quiz.rule';
import { examInProgressRule } from './exam-in-progress.rule';
import { examLiveRule } from './exam-live.rule';
import { examTodayRule } from './exam-today.rule';
import { goalRemainingRule } from './goal-remaining.rule';
import { newExamRule } from './new-exam.rule';
import { quickReviewRule } from './quick-review.rule';
import { streakRiskRule } from './streak-risk.rule';
import { weakTopicRule } from './weak-topic.rule';

export { motivationRule } from './motivation.rule';

/// Kural kayıt defteri (Doc 19 §3.1). Yeni kural = yeni dosya + buraya bir satır.
/// Sıra önemsiz — öncelik kartın priority alanından gelir.
export const coachRules: CoachRule[] = [
  examLiveRule,
  examInProgressRule,
  examTodayRule,
  streakRiskRule,
  goalRemainingRule,
  quickReviewRule,
  weakTopicRule,
  courseTrendRule,
  dailyQuizRule,
  badgeNearRule,
  newExamRule,
  comebackRule,
  examModeRule,
  taperRule,
  slumpWatchRule,
];
