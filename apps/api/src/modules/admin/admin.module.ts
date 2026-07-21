import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuditService } from './audit.service';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminCatalogService } from './catalog/admin-catalog.service';
import { AdminQuestionsService } from './questions/admin-questions.service';
import { AdminUsersService } from './users/admin-users.service';
import { AdminLawArticlesService } from './law-articles/admin-law-articles.service';
import { AdminExamsController } from './exams/admin-exams.controller';
import { AdminExamsService } from './exams/admin-exams.service';
import { ReportsModule } from '../reports/reports.module';

/**
 * Admin paneli API'si (Doc 9). Panel yalnızca bu API'yi çağırır — iş mantığı
 * burada, panelde değil. RBAC: admin/editor (Doc 8), audit log her işlemde.
 */
@Module({
  imports: [ReportsModule],
  controllers: [AdminController, AdminExamsController],
  providers: [
    AuditService,
    AdminDashboardService,
    AdminCatalogService,
    AdminQuestionsService,
    AdminUsersService,
    AdminLawArticlesService,
    AdminExamsService,
  ],
})
export class AdminModule {}
