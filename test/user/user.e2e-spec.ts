import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  createTestingApp,
  excpectResponseInvalidAuth,
  excpectResponseMissingAuth,
} from '../helper.js'
import { AppModule } from '../../src/app.module.js'
import { DatabaseModule } from '../../src/common/database/database.module.js'
import { TestDatabaseModule } from '../common/database/test-database.js'
import {
  createUserMock,
  USER_EMAIL,
  USER_PASSWORD,
} from '../common/mock/db-mock-data.js'
import { User } from '../../src/user/entities/user.entity.js'

describe('User', () => {
  let user: User
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .compile()

    user = await createUserMock(moduleRef)

    app = createTestingApp(moduleRef)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/GET users/me', () => {
    let accessToken: string

    beforeEach(async () => {
      const result = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: USER_EMAIL,
          password: USER_PASSWORD,
        })
      accessToken = result.body.data.accessToken
    })

    it('should return 401 when auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .send()

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer lol')
        .send()

      excpectResponseInvalidAuth(response)
    })

    it('should return 200 with correct user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send()

      expect(response.statusCode).toBe(200)
      expect(response.body).toStrictEqual({
        status: 200,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    })
  })
})
