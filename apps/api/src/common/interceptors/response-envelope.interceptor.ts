import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Başarılı yanıtları { data: ... } zarfına sarar (Doc 7).
 * Zaten { data } veya { data, meta } döndüren handler'lar olduğu gibi geçer.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'data' in payload) {
          return payload;
        }
        return { data: payload };
      }),
    );
  }
}
