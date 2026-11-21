import request, { Response } from 'supertest'
import { INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { USER_EMAIL, USER_PASSWORD } from './common/mock/db-mock-data.js'
import { UserToken } from '../src/auth/entities/user-credential.entity.js'
import { configureApp } from '../src/main.js'

export function createTestingApp(moduleRef: TestingModule): INestApplication {
  const app = moduleRef.createNestApplication()
  configureApp(app)
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
