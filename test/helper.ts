import { INestApplication, ValidationPipe } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { ResponseTransformerIntereceptor } from '../src/common/interceptors/response-transformer.interceptor.js'
import { InvalidRequestException } from '../src/common/app-exception.js'
import { InvalidRequestExceptionFilter } from '../src/common/exception-filter/invalid-request.exception-filter.js'
import { HttpAdapterHost } from '@nestjs/core'
import { UnauthorizedExceptionFilter } from '../src/common/exception-filter/unauthorized.exception-filter.js'

export function createTestingApp(moduleRef: TestingModule): INestApplication {
  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      exceptionFactory: (errors) =>
        InvalidRequestException.fromValidationPipe(errors),
    }),
  )
  app.useGlobalInterceptors(new ResponseTransformerIntereceptor())
  app.useGlobalFilters(
    new InvalidRequestExceptionFilter(app.get(HttpAdapterHost)),
    new UnauthorizedExceptionFilter(app.get(HttpAdapterHost)),
  )
  return app
}
