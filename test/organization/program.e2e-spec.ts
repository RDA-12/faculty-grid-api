import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module.js'
import { DatabaseModule } from '../../src/common/database/database.module.js'
import { TestDatabaseModule } from '../common/database/test-database.js'
import { ConfigService } from '@nestjs/config'
import { TestConfig } from '../common/test-config.js'
import { createUserMock } from '../common/mock/db-mock-data.js'
import {
  createTestingApp,
  excpectResponseInvalidAuth,
  excpectResponseMissingAuth,
  getAccessToken,
} from '../helper.js'

describe('Program', () => {
  let faculty: { id: string }
  let accessToken: string
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .overrideProvider(ConfigService)
      .useClass(TestConfig)
      .compile()
    await createUserMock(moduleRef)

    app = createTestingApp(moduleRef)
    await app.init()

    accessToken = (await getAccessToken(app)).accessToken
    const response = await request(app.getHttpServer())
      .post('/faculties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'new faculty',
      })
    faculty = response.body.data
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST programs', () => {
    let payload: {
      name: string
      degreeLevel: string
      facultyId: string
    }

    beforeAll(() => {
      payload = {
        name: 'new faculty',
        degreeLevel: 'bachelor',
        facultyId: faculty.id,
      }
    })

    it('should return 201 with new program', async () => {
      const response = await request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          name: payload.name,
          degreeLevel: payload.degreeLevel,
          facultyId: payload.facultyId,
        },
      })
    })

    it('should return 422 when payload has invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...payload, degreeLevel: 'lol' })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'degreeLevel',
            value: 'lol',
          },
        ],
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/programs')
        .send(payload)

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', 'Bearer lol')
        .send(payload)

      excpectResponseInvalidAuth(response)
    })
  })
})
