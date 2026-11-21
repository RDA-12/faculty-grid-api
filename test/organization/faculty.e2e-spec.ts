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
import { DataSource } from 'typeorm'

describe('Faculty', () => {
  let accessToken: string
  let dataSource: DataSource
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
    dataSource = moduleRef.get(DataSource)

    app = createTestingApp(moduleRef)
    await app.init()

    accessToken = (await getAccessToken(app)).accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST faculties', () => {
    const payload = {
      name: 'new faculty',
    }

    it('should return 201 with new faculties', async () => {
      const response = await request(app.getHttpServer())
        .post('/faculties')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          name: payload.name,
        },
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/faculties')
        .send(payload)

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/faculties')
        .set('Authorization', 'Bearer lol')
        .send(payload)

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET faculties', () => {
    let expected: unknown[] = []

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "faculties" RESTART IDENTITY CASCADE`,
      )
      for (var i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/faculties')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `faculty ${i}`,
          })
        expected.unshift(response.body.data)
      }
    })

    it('should return 200 with faculties', async () => {
      const response = await request(app.getHttpServer())
        .get('/faculties')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: expected,
        pagination: {
          total: 5,
          page: 1,
          pageSize: 10,
        },
      })
    })

    it('should return correct data when pagination used', async () => {
      const response = await request(app.getHttpServer())
        .get('/faculties?page=2&pageSize=1')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: [expected[1]],
        pagination: {
          total: 5,
          page: 2,
          pageSize: 1,
        },
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get('/faculties')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/faculties')
        .set('Authorization', 'Bearer lol')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE faculties/:id', () => {
    let toBeDeleted: { id: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "faculties" RESTART IDENTITY CASCADE`,
      )
    })

    beforeEach(async () => {
      for (var i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/faculties')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `faculty ${i}`,
          })
        if (i === 0) {
          toBeDeleted = response.body.data
        }
      }
    })

    it('should return 204 when deleting correct faculty', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/faculties/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 204 when deleting non-existing faculty', async () => {
      await request(app.getHttpServer())
        .delete(`/faculties/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/faculties/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        `/faculties/nothing`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/faculties/nothing')
        .set('Authorization', 'Bearer lol')

      excpectResponseInvalidAuth(response)
    })
  })
})
