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

    let title: string
    let detail: string
    if (exception.errorCode === 'missing_credentials') {
      title = 'Missing Authentication header'
      detail = 'Please provide valid Authentication header'
    } else if (exception.errorCode === 'missing_api_key') {
      title = 'Missing x-api-key header'
      detail = 'Please provide valid key to that header'
    } else if (exception.errorCode === 'invalid_api_key') {
      title = 'Invalid api key'
      detail = 'Please provide valid api key on the x-api-key header'
    } else {
      title = 'Unauthorized'
      detail = exception.message
    }

    const responseBody = new FailedResponse(
      exception.getStatus(),
      title,
      detail,
    )

    httpAdapter.reply(ctx.getResponse(), responseBody, exception.getStatus())
  }
}
