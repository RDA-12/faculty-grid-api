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

describe('Course', () => {
  let dataSource: DataSource
  let accessToken: string
  let app: INestApplication
  let program: { id: string }
  let otherProgram: { id: string }

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

    const facultyRes = await request(app.getHttpServer())
      .post('/faculties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Engineering' })
    const facultyId = facultyRes.body.data.id

    const programRes = await request(app.getHttpServer())
      .post('/programs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Informatics',
        degreeLevel: 'bachelor',
        facultyId,
      })
    program = programRes.body.data

    const otherProgramRes = await request(app.getHttpServer())
      .post('/programs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Information Systems',
        degreeLevel: 'bachelor',
        facultyId,
      })
    otherProgram = otherProgramRes.body.data
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST courses', () => {
    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "courses" RESTART IDENTITY CASCADE`,
      )
    })

    it('should return 201 when creating a course', async () => {
      const payload = {
        code: 'CS101',
        name: 'Data Structures',
        credits: 3,
        semester: 1,
        courseType: 'mandatory',
        programId: program.id,
      }

      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: payload,
      })
    })

    it('should return 409 when creating duplicate course code in the same program', async () => {
      const payload = {
        code: 'CS101',
        name: 'Data Structures',
        credits: 3,
        semester: 1,
        courseType: 'mandatory',
        programId: program.id,
      }

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...payload,
          name: 'Different Name',
          semester: 2,
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 201 when creating same course code in a different program', async () => {
      const payload = {
        code: 'CS101',
        name: 'Data Structures',
        credits: 3,
        semester: 1,
        courseType: 'mandatory',
        programId: program.id,
      }

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...payload,
          programId: otherProgram.id,
        })

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          ...payload,
          programId: otherProgram.id,
        },
      })
    })

    it('should return 404 when programId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: 'not-found',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 422 when request body has invalid fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: '',
          name: '',
          credits: 0,
          semester: 0,
          courseType: 'invalid',
          programId: '',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body.status).toBe(422)
      const props = response.body.errors.map(
        (e: { property: string }) => e.property,
      )
      expect(props).toEqual(
        expect.arrayContaining([
          'code',
          'name',
          'credits',
          'semester',
          'courseType',
          'programId',
        ]),
      )
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', 'Bearer invalid')
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET courses', () => {
    const expected: Array<Record<string, unknown>> = []

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "courses" RESTART IDENTITY CASCADE`,
      )
      const payloads = [
        {
          code: 'CS101',
          name: 'Programming Fundamentals',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        },
        {
          code: 'CS201',
          name: 'Algorithms',
          credits: 4,
          semester: 2,
          courseType: 'mandatory',
          programId: program.id,
        },
        {
          code: 'IS301',
          name: 'Cloud Architecture',
          credits: 3,
          semester: 5,
          courseType: 'elective',
          programId: otherProgram.id,
        },
      ]
      for (const payload of payloads) {
        const res = await request(app.getHttpServer())
          .post('/courses')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payload)
        expected.unshift(res.body.data)
      }
    })

    it('should return 200 with courses', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: expected,
        pagination: {
          total: 3,
          page: 1,
          pageSize: 10,
        },
      })
    })

    it('should return paginated courses', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses?page=2&pageSize=1')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: [expected[1]],
        pagination: {
          total: 3,
          page: 2,
          pageSize: 1,
        },
      })
    })

    it('should filter by programId, semester, courseType, and search (code or name)', async () => {
      const resProgram = await request(app.getHttpServer())
        .get(`/courses?programId=${otherProgram.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resProgram.body.data).toStrictEqual([expected[0]])

      const resSemester = await request(app.getHttpServer())
        .get('/courses?semester=2')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resSemester.body.data).toStrictEqual([expected[1]])

      const resType = await request(app.getHttpServer())
        .get('/courses?courseType=elective')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resType.body.data).toStrictEqual([expected[0]])

      const resSearchCode = await request(app.getHttpServer())
        .get('/courses?search=CS101')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resSearchCode.body.data).toStrictEqual([expected[2]])

      const resSearchName = await request(app.getHttpServer())
        .get('/courses?search=Algorithms')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resSearchName.body.data).toStrictEqual([expected[1]])
    })

    it('should return 422 when semester query is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses?semester=abc')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'semester',
          },
        ],
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get('/courses')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET courses/:id', () => {
    let createdCourse: { id: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "courses" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })
      createdCourse = res.body.data
    })

    it('should return 200 when course is found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/courses/${createdCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdCourse,
      })
    })

    it('should return 404 when course is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/courses/${createdCourse.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/courses/${createdCourse.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT courses/:id', () => {
    let createdCourse: { id: string }
    let secondCourse: { id: string; code: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "courses" RESTART IDENTITY CASCADE`,
      )
      const res1 = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })
      createdCourse = res1.body.data

      const res2 = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'IS201',
          name: 'Database Systems',
          credits: 3,
          semester: 2,
          courseType: 'mandatory',
          programId: otherProgram.id,
        })
      secondCourse = res2.body.data
    })

    it('should return 200 with updated course and persist changes', async () => {
      const updatePayload = {
        code: 'IS202',
        name: 'Advanced Databases',
        credits: 4,
        semester: 4,
        courseType: 'elective',
        programId: otherProgram.id,
      }

      const response = await request(app.getHttpServer())
        .put(`/courses/${createdCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdCourse.id,
          ...updatePayload,
        },
      })

      const getRes = await request(app.getHttpServer())
        .get(`/courses/${createdCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(getRes.body.data).toMatchObject({
        id: createdCourse.id,
        ...updatePayload,
      })
    })

    it('should return 409 when updating to duplicate code in target program', async () => {
      const response = await request(app.getHttpServer())
        .put(`/courses/${createdCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: secondCourse.code,
          name: 'Conflict Course',
          credits: 3,
          semester: 2,
          courseType: 'mandatory',
          programId: otherProgram.id,
        })

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ status: 409 })
    })

    it('should return 404 when course is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/courses/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'CS999',
          name: 'Missing Course',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 404 when target programId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .put(`/courses/${createdCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: 'not-found',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 422 when update body is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/courses/${createdCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: '',
          name: '',
          credits: 0,
          semester: 0,
          courseType: 'invalid',
          programId: '',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body.status).toBe(422)
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/courses/${createdCourse.id}`)
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/courses/${createdCourse.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE courses/:id', () => {
    let toBeDeleted: { id: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "courses" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: 'mandatory',
          programId: program.id,
        })
      toBeDeleted = res.body.data
    })

    it('should return 204 when deleting existing course', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/courses/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 204 when deleting non-existing course', async () => {
      await request(app.getHttpServer())
        .delete(`/courses/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/courses/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/courses/nothing',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/courses/nothing')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })
})
