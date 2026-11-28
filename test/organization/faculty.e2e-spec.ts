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
        .get('/faculties')
        .set('Authorization', 'Bearer lol')

      excpectResponseInvalidAuth(response)
    })

    it('should return correct faculties when search query included', async () => {
      const response = await request(app.getHttpServer())
        .get('/faculties?search=0')
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
  })

  describe('/GET faculties/:id', () => {
    let createdFaculty: { id: string; name: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "faculties" RESTART IDENTITY CASCADE`,
      )
      const response = await request(app.getHttpServer())
        .post('/faculties')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Faculty of Science',
        })
      createdFaculty = response.body.data
    })

    it('should return 200 with faculty when found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/faculties/${createdFaculty.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdFaculty,
      })
    })

    it('should return 404 when faculty is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/faculties/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/faculties/${createdFaculty.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/faculties/${createdFaculty.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT faculties/:id', () => {
    let createdFaculty: { id: string; name: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "faculties" RESTART IDENTITY CASCADE`,
      )
      const response = await request(app.getHttpServer())
        .post('/faculties')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Faculty of Science',
        })
      createdFaculty = response.body.data
    })

    it('should return 200 with updated faculty and persist changes', async () => {
      const updatePayload = {
        name: 'Faculty of Engineering',
      }

      const response = await request(app.getHttpServer())
        .put(`/faculties/${createdFaculty.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdFaculty.id,
          name: updatePayload.name,
        },
      })

      const getResponse = await request(app.getHttpServer())
        .get('/faculties')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.body.data).toEqual([
        {
          id: createdFaculty.id,
          name: updatePayload.name,
        },
      ])
    })

    it('should return 404 when faculty is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/faculties/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Faculty of Engineering',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 422 when payload has empty name', async () => {
      const response = await request(app.getHttpServer())
        .put(`/faculties/${createdFaculty.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
        })

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
        .put(`/faculties/${createdFaculty.id}`)
        .send({
          name: 'Faculty of Engineering',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/faculties/${createdFaculty.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          name: 'Faculty of Engineering',
        })

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
