import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { AppException } from '../app-exception.js'
import { FailedResponse } from '../app-response.js'

export class LoggingInterceptor implements NestInterceptor {
  constructor() {
    this.logger = new Logger('LoggingInterceptor')
  }

  private readonly logger: Logger

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const start = performance.now()
    const requestCtx: Record<string, any> = {}
    if (context.getType() === 'http') {
      const httpCtx = context.switchToHttp()
      const request = httpCtx.getRequest<Request>()

      requestCtx.method = request.method
      requestCtx.url = request.url
      requestCtx.body = request.body
    }

    this.logger.debug('new request received', requestCtx)

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logger.debug('request finished', {
            data: data,
            duration: performance.now() - start,
          })
        },
        error: (err) => {
          if (err instanceof AppException) {
            this.logger.debug('request finished', {
              data: new FailedResponse(err.status, err.title, err.detail),
              duration: performance.now() - start,
            })
          } else {
            this.logger.error('request finished with error', {
              error: err,
              duration: performance.now() - start,
            })
          }
        },
      }),
    )
  }
}
