import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuditService } from './audit.service';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminCatalogService } from './catalog/admin-catalog.service';
import { AdminQuestionsService } from './questions/admin-questions.service';
import { AdminUsersService } from './users/admin-users.service';

/**
 * Admin paneli API'si (Doc 9). Panel yalnızca bu API'yi çağırır — iş mantığı
 * burada, panelde değil. RBAC: admin/editor (Doc 8), audit log her işlemde.
 */
@Module({
  controllers: [AdminController],
  providers: [
    AuditService,
    AdminDashboardService,
    AdminCatalogService,
    AdminQuestionsService,
    AdminUsersService,
  ],
})
export class AdminModule {}
