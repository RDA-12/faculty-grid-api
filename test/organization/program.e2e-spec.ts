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

describe('Program', () => {
  let faculty: { id: string }
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

  describe('/GET programs', () => {
    let expected: unknown[] = []

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "programs" RESTART IDENTITY CASCADE`,
      )
      for (var i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/programs')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `program ${i}`,
            facultyId: faculty.id,
            degreeLevel: 'bachelor',
          })
        expected.unshift(response.body.data)
      }
    })

    it('should return 200 with programs', async () => {
      const response = await request(app.getHttpServer())
        .get('/programs')
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
        .get('/programs?page=2&pageSize=1')
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
        .get('/programs?search=0')
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

    it('should return correct data when filtered by faculty', async () => {
      const response = await request(app.getHttpServer())
        .get('/programs?facultyId=lol')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 10,
        },
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get('/programs')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', 'Bearer lol')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT programs/:id', () => {
    let secondFaculty: { id: string }
    let createdProgram: {
      id: string
      name: string
      degreeLevel: string
      facultyId: string
    }

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/faculties')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'second faculty',
        })
      secondFaculty = response.body.data
    })

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "programs" RESTART IDENTITY CASCADE`,
      )
      const response = await request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Informatics',
          degreeLevel: 'bachelor',
          facultyId: faculty.id,
        })
      createdProgram = response.body.data
    })

    it('should return 200 with updated program and persist changes', async () => {
      const updatePayload = {
        name: 'Computer Science',
        degreeLevel: 'master',
        facultyId: secondFaculty.id,
      }

      const response = await request(app.getHttpServer())
        .put(`/programs/${createdProgram.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdProgram.id,
          name: updatePayload.name,
          degreeLevel: updatePayload.degreeLevel,
          facultyId: updatePayload.facultyId,
        },
      })

      const getResponse = await request(app.getHttpServer())
        .get('/programs')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.body.data).toEqual([
        {
          id: createdProgram.id,
          name: updatePayload.name,
          degreeLevel: updatePayload.degreeLevel,
          facultyId: updatePayload.facultyId,
        },
      ])
    })

    it('should return 404 when program is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/programs/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Computer Science',
          degreeLevel: 'master',
          facultyId: faculty.id,
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 404 when faculty is not found', async () => {
      const response = await request(app.getHttpServer())
        .put(`/programs/${createdProgram.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Computer Science',
          degreeLevel: 'master',
          facultyId: 'not-found',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 422 when payload has invalid data', async () => {
      const response = await request(app.getHttpServer())
        .put(`/programs/${createdProgram.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
          degreeLevel: 'invalid',
          facultyId: faculty.id,
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/programs/${createdProgram.id}`)
        .send({
          name: 'Computer Science',
          degreeLevel: 'master',
          facultyId: faculty.id,
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/programs/${createdProgram.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          name: 'Computer Science',
          degreeLevel: 'master',
          facultyId: faculty.id,
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE programs/:id', () => {
    let toBeDeleted: { id: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "programs" RESTART IDENTITY CASCADE`,
      )
    })

    beforeEach(async () => {
      for (var i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/programs')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `program ${i}`,
            degreeLevel: 'bachelor',
            facultyId: faculty.id,
          })
        if (i === 0) {
          toBeDeleted = response.body.data
        }
      }
    })

    it('should return 204 when deleting correct program', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/programs/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 204 when deleting non-existing program', async () => {
      await request(app.getHttpServer())
        .delete(`/programs/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/programs/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        `/programs/nothing`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/programs/nothing')
        .set('Authorization', 'Bearer lol')

      excpectResponseInvalidAuth(response)
    })
  })
})
