import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();

    console.log(`➡️ ${method} ${url} - Iniciando`);

    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(
            `✅ ${method} ${url} - Concluído em ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}
