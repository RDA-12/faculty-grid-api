import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { FailedResponse } from '../app-response.js'

@Catch()
export class CatchEverythingExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()

    if (exception instanceof HttpException && exception.getStatus() < 500) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      let title = exception.name
      let detail = exception.message

      if (typeof exceptionResponse === 'string') {
        detail = exceptionResponse
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as {
          error?: unknown
          message?: unknown
        }
        if (typeof res.error === 'string' && res.error.length > 0) {
          title = res.error
        }
        if (typeof res.message === 'string' && res.message.length > 0) {
          detail = res.message
        } else if (Array.isArray(res.message) && res.message.length > 0) {
          detail = res.message.join(', ')
        }
      }

      const responseBody = new FailedResponse(status, title, detail)
      httpAdapter.reply(ctx.getResponse(), responseBody, status)
      return
    }

    const responseBody = new FailedResponse(
      500,
      'Internal error',
      'Something went wrong in the server',
    )

    httpAdapter.reply(ctx.getResponse(), responseBody, 500)
  }
}
