import request, { Response } from 'supertest'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { ResponseTransformerIntereceptor } from '../src/common/interceptors/response-transformer.interceptor.js'
import { InvalidRequestException } from '../src/common/app-exception.js'
import { InvalidRequestExceptionFilter } from '../src/common/exception-filter/invalid-request.exception-filter.js'
import { HttpAdapterHost } from '@nestjs/core'
import { UnauthorizedExceptionFilter } from '../src/common/exception-filter/unauthorized.exception-filter.js'
import { USER_EMAIL, USER_PASSWORD } from './common/mock/db-mock-data.js'
import { UserToken } from '../src/auth/entities/user-credential.entity.js'

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

/**
 * Login user with USER_EMAIL and USER_PASSWORD from db-mock-data and return its accessToken
 */
export async function getAccessToken(
  app: INestApplication,
): Promise<UserToken> {
  const response = await request(app.getHttpServer()).post('/auth/login').send({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  })

  const data = response.body.data
  return new UserToken({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: 0,
  })
}

export function excpectResponseMissingAuth(response: Response) {
  expect(response.statusCode).toBe(401)
  expect(response.body).toMatchObject({
    status: 401,
    title: 'Missing Authentication header',
    detail: 'Please provide valid Authentication header',
  })
}

export function excpectResponseInvalidAuth(response: Response) {
  expect(response.statusCode).toBe(401)
  expect(response.body).toMatchObject({
    status: 401,
    title: 'Unauthorized',
  })
}
