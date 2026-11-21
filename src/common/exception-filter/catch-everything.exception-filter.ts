import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { FailedResponse } from '../app-response.js'

@Catch()
export class CatchEverythingExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(_exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()

    const responseBody = new FailedResponse(
      500,
      'Internal error',
      'Something went wrong in the server',
    )

    httpAdapter.reply(ctx.getResponse(), responseBody, 500)
  }
}
