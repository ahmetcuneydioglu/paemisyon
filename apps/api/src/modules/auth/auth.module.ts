import { Global, Module } from '@nestjs/common';
import { SupabaseTokenService } from './supabase-token.service';
import { UserSyncService } from './user-sync.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SubscriptionGuard } from './guards/subscription.guard';

/**
 * Kimlik/yetki altyapısı (Doc 8). Global — guard'lar her modülde import'suz kullanılabilir.
 * Kimlik primitifleri Supabase Auth'ta; yetki (rol/premium/erişim) burada, NestJS'te.
 */
@Global()
@Module({
  providers: [
    SupabaseTokenService,
    UserSyncService,
    JwtAuthGuard,
    RolesGuard,
    SubscriptionGuard,
  ],
  exports: [
    SupabaseTokenService,
    UserSyncService,
    JwtAuthGuard,
    RolesGuard,
    SubscriptionGuard,
  ],
})
export class AuthModule {}
