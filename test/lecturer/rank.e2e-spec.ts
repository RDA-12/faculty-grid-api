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

describe('Rank', () => {
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

  describe('/POST ranks', () => {
    const payload = {
      name: 'Penata Muda (III/a)',
      type: 'asn',
    }

    beforeEach(async () => {
      await dataSource.query(`TRUNCATE TABLE "ranks" RESTART IDENTITY CASCADE`)
    })

    it('should return 201 with new rank', async () => {
      const response = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          name: payload.name,
          type: payload.type,
        },
      })
    })

    it('should allow same name with different type', async () => {
      await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      const response = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: payload.name, type: 'military' })

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          name: payload.name,
          type: 'military',
        },
      })
    })

    it('should return 409 when (name, type) already exists', async () => {
      await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      const response = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({
        status: 409,
      })
    })

    it('should return 422 when payload has invalid type or empty name', async () => {
      const response = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '', type: 'invalid' })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/ranks')
        .send(payload)

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', 'Bearer invalid')
        .send(payload)

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET ranks', () => {
    const expected: Array<{ id: string; name: string; type: string }> = []

    beforeAll(async () => {
      await dataSource.query(`TRUNCATE TABLE "ranks" RESTART IDENTITY CASCADE`)
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/ranks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `Rank ${i}`,
            type: i % 2 === 0 ? 'asn' : 'military',
          })
        expected.unshift(response.body.data)
      }
    })

    it('should return 200 with ranks', async () => {
      const response = await request(app.getHttpServer())
        .get('/ranks')
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
        .get('/ranks?page=2&pageSize=1')
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

    it('should return correct data when filtered by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/ranks?type=military')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: expected.filter((it) => it.type === 'military'),
        pagination: {
          total: 2,
          page: 1,
          pageSize: 10,
        },
      })
    })

    it('should return correct data when search matches name', async () => {
      const response = await request(app.getHttpServer())
        .get('/ranks?search=Rank 0')
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
      const response = await request(app.getHttpServer()).get('/ranks')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/ranks')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET ranks/:id', () => {
    let createdRank: { id: string; name: string; type: string }

    beforeAll(async () => {
      await dataSource.query(`TRUNCATE TABLE "ranks" RESTART IDENTITY CASCADE`)
      const response = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Penata Muda (III/a)',
          type: 'asn',
        })
      createdRank = response.body.data
    })

    it('should return 200 with rank when found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ranks/${createdRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdRank,
      })
    })

    it('should return 404 when rank is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/ranks/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/ranks/${createdRank.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ranks/${createdRank.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT ranks/:id', () => {
    let createdRank: { id: string; name: string; type: string }
    let otherRank: { id: string; name: string; type: string }

    beforeEach(async () => {
      await dataSource.query(`TRUNCATE TABLE "ranks" RESTART IDENTITY CASCADE`)
      const res1 = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Penata Muda (III/a)',
          type: 'asn',
        })
      createdRank = res1.body.data

      const res2 = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Mayor',
          type: 'military',
        })
      otherRank = res2.body.data
    })

    it('should return 200 with updated rank and persist changes', async () => {
      const updatePayload = {
        name: 'Kapten',
        type: 'military',
      }

      const response = await request(app.getHttpServer())
        .put(`/ranks/${createdRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdRank.id,
          name: updatePayload.name,
          type: updatePayload.type,
        },
      })

      const getResponse = await request(app.getHttpServer())
        .get(`/ranks/${createdRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.body.data).toMatchObject({
        id: createdRank.id,
        name: updatePayload.name,
        type: updatePayload.type,
      })
    })

    it('should return 409 when updating to duplicate (name, type)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/ranks/${createdRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: otherRank.name,
          type: otherRank.type,
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({
        status: 409,
      })
    })

    it('should return 404 when rank is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/ranks/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Kapten',
          type: 'military',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 422 when payload has invalid data', async () => {
      const response = await request(app.getHttpServer())
        .put(`/ranks/${createdRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
          type: 'invalid',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/ranks/${createdRank.id}`)
        .send({
          name: 'Kapten',
          type: 'military',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/ranks/${createdRank.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          name: 'Kapten',
          type: 'military',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE ranks/:id', () => {
    let toBeDeleted: { id: string; name: string; type: string }

    beforeEach(async () => {
      await dataSource.query(`TRUNCATE TABLE "ranks" RESTART IDENTITY CASCADE`)
      const response = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Penata Muda (III/a)',
          type: 'asn',
        })
      toBeDeleted = response.body.data
    })

    it('should return 204 when deleting existing rank and allow re-creating it', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/ranks/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})

      const recreateResponse = await request(app.getHttpServer())
        .post('/ranks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: toBeDeleted.name,
          type: toBeDeleted.type,
        })

      expect(recreateResponse.statusCode).toBe(201)
    })

    it('should return 204 when deleting non-existing rank', async () => {
      await request(app.getHttpServer())
        .delete(`/ranks/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/ranks/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/ranks/nothing',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/ranks/nothing')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })
})
