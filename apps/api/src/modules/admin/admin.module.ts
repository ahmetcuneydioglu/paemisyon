import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuditService } from './audit.service';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminMetricsService } from './dashboard/admin-metrics.service';
import { AdminCatalogService } from './catalog/admin-catalog.service';
import { AdminQuestionsService } from './questions/admin-questions.service';
import { AdminUsersService } from './users/admin-users.service';
import { AdminLawArticlesService } from './law-articles/admin-law-articles.service';
import { AdminExamsController } from './exams/admin-exams.controller';
import { AdminExamsService } from './exams/admin-exams.service';
import { AdminPastExamsController } from './past-exams/admin-past-exams.controller';
import { AdminPastExamsService } from './past-exams/admin-past-exams.service';
import { AdminPlansController } from './plans/admin-plans.controller';
import { AdminPlansService } from './plans/admin-plans.service';
import { AdminSummariesController } from './summaries/admin-summaries.controller';
import { AdminSummariesService } from './summaries/admin-summaries.service';
import { AdminArticleSummariesController } from './summaries/admin-article-summaries.controller';
import { AdminArticleSummariesService } from './summaries/admin-article-summaries.service';
import { PublicModule } from '../public/public.module';
import { ReportsModule } from '../reports/reports.module';
import { ExamsModule } from '../exams/exams.module';
import { QuizModule } from '../quiz/quiz.module';
import { AdminExamAdjustmentsService } from './exams/admin-exam-adjustments.service';

/**
 * Admin paneli API'si (Doc 9). Panel yalnızca bu API'yi çağırır — iş mantığı
 * burada, panelde değil. RBAC: admin/editor (Doc 8), audit log her işlemde.
 */
@Module({
  imports: [ReportsModule, PublicModule, ExamsModule, QuizModule], // ExamsModule/QuizModule: Doc 50 soru paketi, iptal yeniden puanlama
  controllers: [
    AdminController,
    AdminExamsController,
    AdminPastExamsController,
    AdminPlansController,
    AdminSummariesController, // Doc 53 konu özetleri
    AdminArticleSummariesController, // Doc 54 madde özetleri
  ],
  providers: [
    AuditService,
    AdminDashboardService,
    AdminMetricsService,
    AdminCatalogService,
    AdminQuestionsService,
    AdminUsersService,
    AdminLawArticlesService,
    AdminExamsService,
    AdminExamAdjustmentsService,
    AdminPastExamsService,
    AdminPlansService,
    AdminSummariesService,
    AdminArticleSummariesService,
  ],
})
export class AdminModule {}
