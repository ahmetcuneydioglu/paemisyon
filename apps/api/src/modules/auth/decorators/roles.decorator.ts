import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/// Endpoint'i belirli rollere kısıtlar (RolesGuard ile). Örn: @Roles('admin', 'editor')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
