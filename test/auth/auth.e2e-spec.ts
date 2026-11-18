import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { createTestingApp } from '../helper.js'
import { TestDatabaseModule } from '../common/database/test-database.js'
import { AppModule } from '../../src/app.module.js'
import { DatabaseModule } from '../../src/common/database/database.module.js'
import {
  createUserMock,
  USER_EMAIL,
  USER_PASSWORD,
} from '../common/mock/db-mock-data.js'

describe('Auth', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .compile()
    await createUserMock(moduleRef)

    app = createTestingApp(moduleRef)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST login', () => {
    const payload = {
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }

    it('should return 422 when request body is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'lol', password: 'password' })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        title: 'Invalid request body',
        detail:
          'There are invalid properties provided in the body. See errors for details',
        errors: [
          {
            property: 'email',
            value: 'lol',
          },
        ],
      })
    })

    it('should return 200 with token when LoginUseCase success', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({ status: 200 })
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('refreshToken')
      expect(response.body.data).toHaveProperty('expiresIn')
    })

    it('should return 401 when provided credentials is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: USER_EMAIL,
          password: 'failed',
        })

      expect(response.statusCode).toBe(401)
      expect(response.body).toStrictEqual({
        status: 401,
        title: 'Provided credential is invalid',
        detail: 'Email/password/both is invalid. Please check again',
      })
    })
  })
})
