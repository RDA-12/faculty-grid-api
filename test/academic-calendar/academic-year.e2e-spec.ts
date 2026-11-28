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

describe('AcademicYear', () => {
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

  describe('/POST academic-years', () => {
    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "academic_years" RESTART IDENTITY CASCADE`,
      )
    })

    it('should return 201 with default planned status when status is omitted', async () => {
      const payload = {
        name: '2026/2027',
        startDate: '2026-08-01',
        endDate: '2027-07-31',
      }

      const response = await request(app.getHttpServer())
        .post('/academic-years')
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

    it('should return 201 with explicit active status', async () => {
      const payload = {
        name: '2026/2027',
        startDate: '2026-08-01',
        endDate: '2027-07-31',
        status: 'active',
      }

      const response = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: payload,
      })
    })

    it('should return 409 when creating duplicate academic year name', async () => {
      await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
        })

      const response = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2027-08-01',
          endDate: '2028-07-31',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 409 when creating a second active academic year', async () => {
      await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2025/2026',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: 'active',
        })

      const response = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: 'active',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 409 when date range overlaps an existing academic year', async () => {
      await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
        })

      const response = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2027/2028',
          startDate: '2027-07-15',
          endDate: '2028-07-31',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 422 when endDate equals startDate or is earlier than startDate', async () => {
      const equalDatesRes = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2026-08-01',
        })

      expect(equalDatesRes.statusCode).toBe(422)
      expect(equalDatesRes.body).toMatchObject({
        status: 422,
        errors: [{ property: 'endDate' }],
      })

      const earlierDateRes = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2026-07-31',
        })

      expect(earlierDateRes.statusCode).toBe(422)
      expect(earlierDateRes.body).toMatchObject({
        status: 422,
        errors: [{ property: 'endDate' }],
      })
    })

    it('should return 422 when name, dates, or status are invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
          startDate: '2026-08-01T00:00:00Z',
          endDate: 'invalid-date',
          status: 'unknown',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body.status).toBe(422)
      const props = response.body.errors.map(
        (e: { property: string }) => e.property,
      )
      expect(props).toEqual(
        expect.arrayContaining(['name', 'startDate', 'endDate', 'status']),
      )
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/academic-years')
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', 'Bearer invalid')
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET academic-years', () => {
    const created: Array<Record<string, unknown>> = []

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "academic_years" RESTART IDENTITY CASCADE`,
      )
      const payloads = [
        {
          name: '2025/2026',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: 'archived',
        },
        {
          name: '2027/2028',
          startDate: '2027-08-01',
          endDate: '2028-07-31',
          status: 'planned',
        },
        {
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: 'active',
        },
      ]
      for (const payload of payloads) {
        const res = await request(app.getHttpServer())
          .post('/academic-years')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payload)
        created.push(res.body.data)
      }
    })

    it('should return 200 ordered by startDate DESC', async () => {
      const expectedOrdered = [created[1], created[2], created[0]]
      const response = await request(app.getHttpServer())
        .get('/academic-years')
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

    it('should return paginated academic years', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic-years?page=2&pageSize=1')
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

    it('should filter by status and search', async () => {
      const resStatus = await request(app.getHttpServer())
        .get('/academic-years?status=active')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resStatus.body.data).toStrictEqual([created[2]])

      const resSearch = await request(app.getHttpServer())
        .get('/academic-years?search=2025')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resSearch.body.data).toStrictEqual([created[0]])
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get('/academic-years')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic-years')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET academic-years/:id', () => {
    let createdYear: { id: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "academic_years" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
        })
      createdYear = res.body.data
    })

    it('should return 200 when academic year is found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/academic-years/${createdYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdYear,
      })
    })

    it('should return 404 when academic year is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic-years/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/academic-years/${createdYear.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/academic-years/${createdYear.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT academic-years/:id', () => {
    let createdYear: { id: string }
    let secondYear: { id: string; name: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "academic_years" RESTART IDENTITY CASCADE`,
      )
      const res1 = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: 'planned',
        })
      createdYear = res1.body.data

      const res2 = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2025/2026',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: 'active',
        })
      secondYear = res2.body.data
    })

    it('should return 200 with updated academic year and persist changes', async () => {
      const updatePayload = {
        name: '2026/2027 Revised',
        startDate: '2026-08-10',
        endDate: '2027-07-20',
        status: 'archived',
      }

      const response = await request(app.getHttpServer())
        .put(`/academic-years/${createdYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdYear.id,
          ...updatePayload,
        },
      })

      const getRes = await request(app.getHttpServer())
        .get(`/academic-years/${createdYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(getRes.body.data).toMatchObject({
        id: createdYear.id,
        ...updatePayload,
      })
    })

    it('should return 409 when updating to duplicate name', async () => {
      const response = await request(app.getHttpServer())
        .put(`/academic-years/${createdYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: secondYear.name,
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: 'planned',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 409 when updating to active while another is active', async () => {
      const response = await request(app.getHttpServer())
        .put(`/academic-years/${createdYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: 'active',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 409 when updating to overlapping date range', async () => {
      const response = await request(app.getHttpServer())
        .put(`/academic-years/${createdYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-07-15',
          endDate: '2027-07-31',
          status: 'planned',
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 404 when academic year is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/academic-years/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2028/2029',
          startDate: '2028-08-01',
          endDate: '2029-07-31',
          status: 'planned',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 422 when status is missing or endDate <= startDate', async () => {
      const response = await request(app.getHttpServer())
        .put(`/academic-years/${createdYear.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2026-08-01',
        })

      expect(response.statusCode).toBe(422)
      const props = response.body.errors.map(
        (e: { property: string }) => e.property,
      )
      expect(props).toEqual(expect.arrayContaining(['endDate', 'status']))
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/academic-years/${createdYear.id}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: 'planned',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/academic-years/${createdYear.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: 'planned',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE academic-years/:id', () => {
    let toBeDeleted: { id: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "academic_years" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/academic-years')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
        })
      toBeDeleted = res.body.data
    })

    it('should return 204 when deleting existing academic year', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/academic-years/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 204 when deleting non-existing academic year', async () => {
      await request(app.getHttpServer())
        .delete(`/academic-years/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/academic-years/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/academic-years/nothing',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/academic-years/nothing')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })
})
