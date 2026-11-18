import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { FailedResponse } from '../app-response.js'

@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()

    let responseBody: FailedResponse<unknown>
    if (exception.errorCode === 'missing_credentials') {
      responseBody = new FailedResponse(
        exception.getStatus(),
        'Missing Authentication header',
        'Please provide valid Authentication header',
      )
    } else {
      responseBody = new FailedResponse(
        exception.getStatus(),
        'Unauthorized',
        exception.message,
      )
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, exception.getStatus())
  }
}
