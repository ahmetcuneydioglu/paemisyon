import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth.types';

/**
 * @Roles(...) ile işaretli endpoint'lerde rol kontrolü (Doc 8 — RBAC).
 * JwtAuthGuard'dan SONRA çalışmalı (req.user dolu olmalı). admin/editor uçları için.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const roles = request.user?.roles ?? [];
    if (!required.some((r) => roles.includes(r))) {
      throw new ForbiddenException('Bu işlem için yetkin yok.');
    }
    return true;
  }
}
