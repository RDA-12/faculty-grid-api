import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { InvalidRequestException } from '../app-exception.js'
import { InvalidRequestReponse } from '../app-response.js'

@Catch(InvalidRequestException)
export class InvalidRequestExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: InvalidRequestException, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()

    const responseBody = new InvalidRequestReponse(exception.errors)

    httpAdapter.reply(ctx.getResponse(), responseBody, exception.status)
  }
}
