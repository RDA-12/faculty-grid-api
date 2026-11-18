import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common'
import { AppResult } from '../app-result.js'
import { FailedResponse, SuccessResponse } from '../app-response.js'
import { map, Observable } from 'rxjs'

/**
 * Transform each response (which mainly AppResult) into formatted response
 */
export class ResponseTransformerIntereceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (context.getType() !== 'http') {
      return next.handle()
    }
    const response = context.switchToHttp().getResponse()

    return next.handle().pipe(
      map((result) => {
        // Do not wrap binary file downloads
        if (result instanceof StreamableFile) {
          return result
        }

        // Do not send a JSON body if status is 204 No Content
        if (response.statusCode === 204) {
          return undefined
        }

        if (result instanceof AppResult) {
          if (result.data) {
            return new SuccessResponse(response.statusCode, result.data)
          }
          if (result.exception) {
            // TODO(RDA12): add status, title, and detail on AppException
            response.status(500)
            return new FailedResponse(500, '', '')
          }
        }
        return result
      }),
    )
  }
}
