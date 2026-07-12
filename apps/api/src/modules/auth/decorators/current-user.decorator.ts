import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth.types';

/// Controller'da kimliği doğrulanmış kullanıcıya erişim: @CurrentUser() user: AuthenticatedUser
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return request.user;
  },
);
