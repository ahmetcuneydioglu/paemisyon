import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { REDIRECT_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Başarılı yanıtları { data: ... } zarfına sarar (Doc 7).
 * Zaten { data } veya { data, meta } döndüren handler'lar olduğu gibi geçer.
 * `@Redirect()` uçları sarılmaz: Nest hedefi dönen `{ url }`tan okur; sarılırsa
 * `Location` boş gider (4 Eki 2026'ya dek e-posta çıkış/tıklama uçlarında böyleydi).
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (Reflect.getMetadata(REDIRECT_METADATA, context.getHandler()) !== undefined) {
      return next.handle();
    }
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
