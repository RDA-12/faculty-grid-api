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

describe('FunctionalRank', () => {
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

  describe('/POST functional-ranks', () => {
    const payload = {
      name: 'Lektor',
    }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "functional_ranks" RESTART IDENTITY CASCADE`,
      )
    })

    it('should return 201 with new functional rank', async () => {
      const response = await request(app.getHttpServer())
        .post('/functional-ranks')
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

    it('should return 409 when name already exists', async () => {
      await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      const response = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({
        status: 409,
      })
    })

    it('should return 422 when payload has empty name', async () => {
      const response = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })

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
        .post('/functional-ranks')
        .send(payload)

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', 'Bearer invalid')
        .send(payload)

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET functional-ranks', () => {
    const expected: Array<{ id: string; name: string }> = []

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "functional_ranks" RESTART IDENTITY CASCADE`,
      )
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/functional-ranks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `Functional Rank ${i}`,
          })
        expected.unshift(response.body.data)
      }
    })

    it('should return 200 with functional ranks', async () => {
      const response = await request(app.getHttpServer())
        .get('/functional-ranks')
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
        .get('/functional-ranks?page=2&pageSize=1')
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
        .get('/functional-ranks?search=0')
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

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        '/functional-ranks',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/functional-ranks')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET functional-ranks/:id', () => {
    let createdFunctionalRank: { id: string; name: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "functional_ranks" RESTART IDENTITY CASCADE`,
      )
      const response = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Lektor',
        })
      createdFunctionalRank = response.body.data
    })

    it('should return 200 with functional rank when found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/functional-ranks/${createdFunctionalRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdFunctionalRank,
      })
    })

    it('should return 404 when functional rank is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/functional-ranks/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/functional-ranks/${createdFunctionalRank.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/functional-ranks/${createdFunctionalRank.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT functional-ranks/:id', () => {
    let createdFunctionalRank: { id: string; name: string }
    let otherFunctionalRank: { id: string; name: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "functional_ranks" RESTART IDENTITY CASCADE`,
      )
      const res1 = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Lektor',
        })
      createdFunctionalRank = res1.body.data

      const res2 = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Guru Besar',
        })
      otherFunctionalRank = res2.body.data
    })

    it('should return 200 with updated functional rank and persist changes', async () => {
      const updatePayload = {
        name: 'Lektor Kepala',
      }

      const response = await request(app.getHttpServer())
        .put(`/functional-ranks/${createdFunctionalRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdFunctionalRank.id,
          name: updatePayload.name,
        },
      })

      const getResponse = await request(app.getHttpServer())
        .get(`/functional-ranks/${createdFunctionalRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.body.data).toMatchObject({
        id: createdFunctionalRank.id,
        name: updatePayload.name,
      })
    })

    it('should return 409 when updating to duplicate name', async () => {
      const response = await request(app.getHttpServer())
        .put(`/functional-ranks/${createdFunctionalRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: otherFunctionalRank.name,
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({
        status: 409,
      })
    })

    it('should return 404 when functional rank is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/functional-ranks/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Lektor Kepala',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 422 when payload has invalid data', async () => {
      const response = await request(app.getHttpServer())
        .put(`/functional-ranks/${createdFunctionalRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/functional-ranks/${createdFunctionalRank.id}`)
        .send({
          name: 'Lektor Kepala',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/functional-ranks/${createdFunctionalRank.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          name: 'Lektor Kepala',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE functional-ranks/:id', () => {
    let toBeDeleted: { id: string; name: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "functional_ranks" RESTART IDENTITY CASCADE`,
      )
      const response = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Lektor',
        })
      toBeDeleted = response.body.data
    })

    it('should return 204 when deleting existing functional rank and allow re-creating it', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/functional-ranks/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})

      const recreateResponse = await request(app.getHttpServer())
        .post('/functional-ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: toBeDeleted.name,
        })

      expect(recreateResponse.statusCode).toBe(201)
    })

    it('should return 204 when deleting non-existing functional rank', async () => {
      await request(app.getHttpServer())
        .delete(`/functional-ranks/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/functional-ranks/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/functional-ranks/nothing',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/functional-ranks/nothing')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })
})
