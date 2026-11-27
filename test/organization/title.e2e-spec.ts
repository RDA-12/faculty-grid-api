import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import { AppModule } from '../../src/app.module.js'
import { DatabaseModule } from '../../src/common/database/database.module.js'
import { TestDatabaseModule } from '../common/database/test-database.js'
import { TestConfig } from '../common/test-config.js'
import { createUserMock } from '../common/mock/db-mock-data.js'
import {
  createTestingApp,
  excpectResponseInvalidAuth,
  excpectResponseMissingAuth,
  getAccessToken,
} from '../helper.js'

describe('Title', () => {
  let dataSource: DataSource
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
    dataSource = moduleRef.get(DataSource)

    app = createTestingApp(moduleRef)
    await app.init()

    accessToken = (await getAccessToken(app)).accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST titles', () => {
    const payload = {
      name: 'Dean',
      scope: 'faculty',
    }

    it('should return 201 with new title', async () => {
      const response = await request(app.getHttpServer())
        .post('/titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          name: payload.name,
          scope: payload.scope,
        },
      })
    })

    it('should return 422 when payload has invalid scope', async () => {
      const response = await request(app.getHttpServer())
        .post('/titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...payload, scope: 'invalid' })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'scope',
            value: 'invalid',
          },
        ],
      })
    })

    it('should return 422 when payload has empty name', async () => {
      const response = await request(app.getHttpServer())
        .post('/titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...payload, name: '' })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'name',
            value: '',
          },
        ],
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/titles')
        .send(payload)

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/titles')
        .set('Authorization', 'Bearer invalid')
        .send(payload)

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET titles', () => {
    const expected: Array<{ id: string; name: string; scope: string }> = []

    beforeAll(async () => {
      await dataSource.query(`TRUNCATE TABLE "titles" RESTART IDENTITY CASCADE`)
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/titles')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `title ${i}`,
            scope: i % 2 === 0 ? 'faculty' : 'program',
          })
        expected.unshift(response.body.data)
      }
    })

    it('should return 200 with titles', async () => {
      const response = await request(app.getHttpServer())
        .get('/titles')
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
        .get('/titles?page=2&pageSize=1')
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

    it('should return correct data when search used', async () => {
      const response = await request(app.getHttpServer())
        .get('/titles?search=0')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: [expected[4]],
        pagination: {
          total: 1,
          page: 1,
          pageSize: 10,
        },
      })
    })

    it('should return correct data when filtered by scope', async () => {
      const response = await request(app.getHttpServer())
        .get('/titles?scope=program')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: expected.filter((it) => it.scope === 'program'),
        pagination: {
          total: 2,
          page: 1,
          pageSize: 10,
        },
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get('/titles')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/titles')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET titles/:id', () => {
    let createdTitle: { id: string; name: string; scope: string }

    beforeAll(async () => {
      await dataSource.query(`TRUNCATE TABLE "titles" RESTART IDENTITY CASCADE`)
      const response = await request(app.getHttpServer())
        .post('/titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Dean',
          scope: 'faculty',
        })
      createdTitle = response.body.data
    })

    it('should return 200 with title when found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/titles/${createdTitle.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdTitle,
      })
    })

    it('should return 404 when title is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/titles/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/titles/${createdTitle.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/titles/${createdTitle.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT titles/:id', () => {
    let createdTitle: { id: string; name: string; scope: string }

    beforeEach(async () => {
      await dataSource.query(`TRUNCATE TABLE "titles" RESTART IDENTITY CASCADE`)
      const response = await request(app.getHttpServer())
        .post('/titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Dean',
          scope: 'faculty',
        })
      createdTitle = response.body.data
    })

    it('should return 200 with updated title and persist changes', async () => {
      const updatePayload = {
        name: 'Head of Program',
        scope: 'program',
      }

      const response = await request(app.getHttpServer())
        .put(`/titles/${createdTitle.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdTitle.id,
          name: updatePayload.name,
          scope: updatePayload.scope,
        },
      })

      const getResponse = await request(app.getHttpServer())
        .get(`/titles/${createdTitle.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.body.data).toMatchObject({
        id: createdTitle.id,
        name: updatePayload.name,
        scope: updatePayload.scope,
      })
    })

    it('should return 404 when title is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/titles/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Head of Program',
          scope: 'program',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 422 when payload has invalid data', async () => {
      const response = await request(app.getHttpServer())
        .put(`/titles/${createdTitle.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
          scope: 'invalid',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/titles/${createdTitle.id}`)
        .send({
          name: 'Head of Program',
          scope: 'program',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/titles/${createdTitle.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          name: 'Head of Program',
          scope: 'program',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE titles/:id', () => {
    let toBeDeleted: { id: string }

    beforeAll(async () => {
      await dataSource.query(`TRUNCATE TABLE "titles" RESTART IDENTITY CASCADE`)
    })

    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/titles')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `title ${i}`,
            scope: 'faculty',
          })
        if (i === 0) {
          toBeDeleted = response.body.data
        }
      }
    })

    it('should return 204 when deleting existing title', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/titles/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 204 when deleting non-existing title', async () => {
      await request(app.getHttpServer())
        .delete(`/titles/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/titles/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/titles/nothing',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/titles/nothing')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })
})
