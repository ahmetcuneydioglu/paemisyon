import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

/** Her isteğe bir trace_id atar; yanıt başlığına ekler (Doc 7 — log korelasyonu). */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request & { traceId?: string }, res: Response, next: NextFunction) {
    const incoming = req.header('x-trace-id');
    const traceId = incoming && incoming.length > 0 ? incoming : randomUUID();
    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);
    next();
  }
}
