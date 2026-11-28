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

describe('Term', () => {
  let dataSource: DataSource
  let accessToken: string
  let app: INestApplication
  let activeYear: { id: string }
  let plannedYear: { id: string }

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

    const activeYearRes = await request(app.getHttpServer())
      .post('/academic-years')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: '2026/2027',
        startDate: '2026-08-01',
        endDate: '2027-07-31',
        status: 'active',
      })
    activeYear = activeYearRes.body.data

    const plannedYearRes = await request(app.getHttpServer())
      .post('/academic-years')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: '2027/2028',
        startDate: '2027-08-01',
        endDate: '2028-07-31',
        status: 'planned',
      })
    plannedYear = plannedYearRes.body.data
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST terms', () => {
    beforeEach(async () => {
      await dataSource.query(`TRUNCATE TABLE "terms" RESTART IDENTITY CASCADE`)
    })

    it('should return 201 with default planned status when status is omitted', async () => {
      const payload = {
        academicYearId: activeYear.id,
        name: '2026/2027 Odd',
        startDate: '2026-08-01',
        endDate: '2027-01-31',
      }

      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          ...payload,
          status: 'planned',
        },
      })
    })

    it('should return 201 with explicit active status under an active academic year', async () => {
      const payload = {
        academicYearId: activeYear.id,
        name: '2026/2027 Odd',
        startDate: '2026-08-01',
        endDate: '2027-01-31',
        status: 'active',
      }

      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: payload,
      })
    })

    it('should return 409 when creating duplicate name in same academic year and 201 in different year', async () => {
      await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: 'Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
        })

      const dupSameYear = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: 'Odd',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
        })
      expect(dupSameYear.statusCode).toBe(409)

      const sameNameOtherYear = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: plannedYear.id,
          name: 'Odd',
          startDate: '2027-08-01',
          endDate: '2028-01-31',
        })
      expect(sameNameOtherYear.statusCode).toBe(201)
    })

    it('should return 409 when creating a second active term', async () => {
      await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'active',
        })

      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: 'active',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 409 when creating an active term under a planned academic year', async () => {
      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: plannedYear.id,
          name: '2027/2028 Odd',
          startDate: '2027-08-01',
          endDate: '2028-01-31',
          status: 'active',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 409 when term dates overlap another term in the same academic year', async () => {
      await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
        })

      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Even',
          startDate: '2027-01-15',
          endDate: '2027-07-31',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 404 when academicYearId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: 'not-found',
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 422 when term dates fall outside parent academic year', async () => {
      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Extended',
          startDate: '2026-07-15',
          endDate: '2027-08-15',
        })

      expect(response.statusCode).toBe(422)
      const props = response.body.errors.map(
        (e: { property: string }) => e.property,
      )
      expect(props).toEqual(expect.arrayContaining(['startDate', 'endDate']))
    })

    it('should return 422 when endDate <= startDate or fields are invalid', async () => {
      const equalDates = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2026-08-01',
        })
      expect(equalDates.statusCode).toBe(422)
      expect(equalDates.body).toMatchObject({
        status: 422,
        errors: [{ property: 'endDate' }],
      })

      const invalidBody = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: '',
          name: '',
          startDate: 'invalid',
          endDate: 'invalid',
          status: 'unknown',
        })
      expect(invalidBody.statusCode).toBe(422)
      const props = invalidBody.body.errors.map(
        (e: { property: string }) => e.property,
      )
      expect(props).toEqual(
        expect.arrayContaining([
          'academicYearId',
          'name',
          'startDate',
          'endDate',
          'status',
        ]),
      )
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).post('/terms').send({
        academicYearId: activeYear.id,
        name: '2026/2027 Odd',
        startDate: '2026-08-01',
        endDate: '2027-01-31',
      })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', 'Bearer invalid')
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET terms', () => {
    const created: Array<Record<string, unknown>> = []

    beforeAll(async () => {
      await dataSource.query(`TRUNCATE TABLE "terms" RESTART IDENTITY CASCADE`)
      const payloads = [
        {
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'archived',
        },
        {
          academicYearId: plannedYear.id,
          name: '2027/2028 Odd',
          startDate: '2027-08-01',
          endDate: '2028-01-31',
          status: 'planned',
        },
        {
          academicYearId: activeYear.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: 'active',
        },
      ]
      for (const payload of payloads) {
        const res = await request(app.getHttpServer())
          .post('/terms')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payload)
        created.push(res.body.data)
      }
    })

    it('should return 200 ordered by startDate DESC', async () => {
      const expectedOrdered = [created[1], created[2], created[0]]
      const response = await request(app.getHttpServer())
        .get('/terms')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: expectedOrdered,
        pagination: {
          total: 3,
          page: 1,
          pageSize: 10,
        },
      })
    })

    it('should return paginated terms', async () => {
      const response = await request(app.getHttpServer())
        .get('/terms?page=2&pageSize=1')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: [created[2]],
        pagination: {
          total: 3,
          page: 2,
          pageSize: 1,
        },
      })
    })

    it('should filter by academicYearId, status, and search', async () => {
      const resYear = await request(app.getHttpServer())
        .get(`/terms?academicYearId=${plannedYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resYear.body.data).toStrictEqual([created[1]])

      const resStatus = await request(app.getHttpServer())
        .get('/terms?status=active')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resStatus.body.data).toStrictEqual([created[2]])

      const resSearch = await request(app.getHttpServer())
        .get('/terms?search=Even')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resSearch.body.data).toStrictEqual([created[2]])
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get('/terms')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/terms')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET terms/:id', () => {
    let createdTerm: { id: string }

    beforeAll(async () => {
      await dataSource.query(`TRUNCATE TABLE "terms" RESTART IDENTITY CASCADE`)
      const res = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
        })
      createdTerm = res.body.data
    })

    it('should return 200 when term is found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdTerm,
      })
    })

    it('should return 404 when term is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/terms/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/terms/${createdTerm.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/terms/${createdTerm.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT terms/:id', () => {
    let createdTerm: { id: string }
    let secondTerm: { id: string; name: string }

    beforeEach(async () => {
      await dataSource.query(`TRUNCATE TABLE "terms" RESTART IDENTITY CASCADE`)
      const res1 = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'planned',
        })
      createdTerm = res1.body.data

      const res2 = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: 'active',
        })
      secondTerm = res2.body.data
    })

    it('should return 200 with updated term and persist changes', async () => {
      const updatePayload = {
        academicYearId: plannedYear.id,
        name: '2027/2028 Odd',
        startDate: '2027-08-15',
        endDate: '2028-01-15',
        status: 'planned',
      }

      const response = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdTerm.id,
          ...updatePayload,
        },
      })

      const getRes = await request(app.getHttpServer())
        .get(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(getRes.body.data).toMatchObject({
        id: createdTerm.id,
        ...updatePayload,
      })
    })

    it('should return 409 when updating to duplicate name in same academic year', async () => {
      const response = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: secondTerm.name,
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'planned',
        })

      expect(response.statusCode).toBe(409)
    })

    it('should return 409 when updating to active while another term is active', async () => {
      const response = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'active',
        })

      expect(response.statusCode).toBe(409)
    })

    it('should return 409 when activating term under planned academic year', async () => {
      const response = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: plannedYear.id,
          name: '2027/2028 Odd',
          startDate: '2027-08-01',
          endDate: '2028-01-31',
          status: 'active',
        })

      expect(response.statusCode).toBe(409)
    })

    it('should return 409 when updating to overlapping dates in same academic year', async () => {
      const response = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-02-15',
          status: 'planned',
        })

      expect(response.statusCode).toBe(409)
    })

    it('should return 404 when term or target academicYearId is not found', async () => {
      const missingTerm = await request(app.getHttpServer())
        .put('/terms/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: 'Missing',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'planned',
        })
      expect(missingTerm.statusCode).toBe(404)

      const missingYear = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: 'not-found',
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'planned',
        })
      expect(missingYear.statusCode).toBe(404)
    })

    it('should return 422 when dates fall outside parent academic year or body is invalid', async () => {
      const outOfBounds = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-07-15',
          endDate: '2027-01-31',
          status: 'planned',
        })
      expect(outOfBounds.statusCode).toBe(422)

      const invalidDto = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2026-08-01',
        })
      expect(invalidDto.statusCode).toBe(422)
      const props = invalidDto.body.errors.map(
        (e: { property: string }) => e.property,
      )
      expect(props).toEqual(expect.arrayContaining(['endDate', 'status']))
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'planned',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/terms/${createdTerm.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: 'planned',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE terms/:id', () => {
    let toBeDeleted: { id: string }

    beforeEach(async () => {
      await dataSource.query(`TRUNCATE TABLE "terms" RESTART IDENTITY CASCADE`)
      const res = await request(app.getHttpServer())
        .post('/terms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          academicYearId: activeYear.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
        })
      toBeDeleted = res.body.data
    })

    it('should return 204 when deleting existing term', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/terms/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 204 when deleting non-existing term', async () => {
      await request(app.getHttpServer())
        .delete(`/terms/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/terms/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/terms/nothing',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/terms/nothing')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })
})
