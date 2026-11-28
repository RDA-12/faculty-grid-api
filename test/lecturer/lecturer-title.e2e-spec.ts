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

describe('LecturerTitle', () => {
  let dataSource: DataSource
  let accessToken: string
  let app: INestApplication
  let faculty: { id: string }
  let otherFaculty: { id: string }
  let program: { id: string }
  let facultyTitle: { id: string }
  let programTitle: { id: string }
  let lecturerOne: { id: string }
  let lecturerTwo: { id: string }

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

    const fac1 = await request(app.getHttpServer())
      .post('/faculties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Engineering' })
    faculty = fac1.body.data

    const fac2 = await request(app.getHttpServer())
      .post('/faculties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Science' })
    otherFaculty = fac2.body.data

    const prog = await request(app.getHttpServer())
      .post('/programs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Informatics',
        degreeLevel: 'bachelor',
        facultyId: faculty.id,
      })
    program = prog.body.data

    const title1 = await request(app.getHttpServer())
      .post('/titles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Dean', scope: 'faculty' })
    facultyTitle = title1.body.data

    const title2 = await request(app.getHttpServer())
      .post('/titles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Head of Program', scope: 'program' })
    programTitle = title2.body.data

    const lec1 = await request(app.getHttpServer())
      .post('/lecturers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Budi Santoso',
        displayName: 'Dr. Budi Santoso',
        programId: program.id,
        employmentStatus: 'contract',
        academicDegree: 'doctorate',
      })
    lecturerOne = lec1.body.data

    const lec2 = await request(app.getHttpServer())
      .post('/lecturers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Siti Aminah',
        displayName: 'Dr. Siti Aminah',
        programId: program.id,
        employmentStatus: 'contract',
        academicDegree: 'doctorate',
      })
    lecturerTwo = lec2.body.data
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST lecturer-titles', () => {
    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturer_titles" RESTART IDENTITY CASCADE`,
      )
    })

    it('should return 201 for faculty-scoped and program-scoped assignments', async () => {
      const facRes = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })

      expect(facRes.statusCode).toBe(201)
      expect(facRes.body).toMatchObject({
        status: 201,
        data: {
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          programId: null,
          startDate: '2026-01-01',
          endDate: null,
        },
      })

      const progRes = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: programTitle.id,
          programId: program.id,
          startDate: '2026-02-01',
        })

      expect(progRes.statusCode).toBe(201)
      expect(progRes.body).toMatchObject({
        status: 201,
        data: {
          lecturerId: lecturerOne.id,
          titleId: programTitle.id,
          facultyId: null,
          programId: program.id,
          startDate: '2026-02-01',
          endDate: null,
        },
      })
    })

    it('should auto-end previous active holder when rotating a seat', async () => {
      const first = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })

      const second = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerTwo.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-06-01',
        })

      expect(second.statusCode).toBe(201)

      const firstAfter = await request(app.getHttpServer())
        .get(`/lecturer-titles/${first.body.data.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(firstAfter.body.data.endDate).toBe('2026-06-01')
    })

    it('should allow same-day startDate and endDate (non-strict)', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
          endDate: '2026-01-01',
        })

      expect(response.statusCode).toBe(201)
      expect(response.body.data).toMatchObject({
        startDate: '2026-01-01',
        endDate: '2026-01-01',
      })
    })

    it('should return 422 via @IsAfter when endDate is earlier than startDate', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-06-01',
          endDate: '2026-01-01',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'endDate',
            value: '2026-01-01',
          },
        ],
      })
    })

    it('should return 422 when new active holder startDate is earlier than current active holder startDate', async () => {
      await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-06-01',
        })

      const response = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerTwo.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-05-01',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'startDate',
            value: '2026-05-01',
          },
        ],
      })
    })

    it('should return 422 when org unit scope does not match title scope', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          programId: program.id,
          startDate: '2026-01-01',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
      })
    })

    it('should return 404 when lecturerId, titleId, facultyId, or programId does not exist', async () => {
      const resLecturer = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: 'not-found',
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      expect(resLecturer.statusCode).toBe(404)

      const resTitle = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: 'not-found',
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      expect(resTitle.statusCode).toBe(404)

      const resFaculty = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: 'not-found',
          startDate: '2026-01-01',
        })
      expect(resFaculty.statusCode).toBe(404)
    })

    it('should return 401 when Auth header is missing or invalid', async () => {
      const missing = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      excpectResponseMissingAuth(missing)

      const invalid = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', 'Bearer invalid')
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      excpectResponseInvalidAuth(invalid)
    })
  })

  describe('/GET lecturer-titles', () => {
    let historicalId: string
    let activeFacultyId: string
    let activeProgramId: string

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturer_titles" RESTART IDENTITY CASCADE`,
      )
      const r1 = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2024-01-01',
          endDate: '2025-12-31',
        })
      historicalId = r1.body.data.id

      const r2 = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerTwo.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      activeFacultyId = r2.body.data.id

      const r3 = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: programTitle.id,
          programId: program.id,
          startDate: '2026-03-01',
        })
      activeProgramId = r3.body.data.id
    })

    it('should return 200 with paginated list and support filters including activeOnly=true', async () => {
      const allRes = await request(app.getHttpServer())
        .get('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(allRes.statusCode).toBe(200)
      expect(allRes.body.data.map((it: { id: string }) => it.id)).toStrictEqual(
        [activeProgramId, activeFacultyId, historicalId],
      )

      const pageRes = await request(app.getHttpServer())
        .get('/lecturer-titles?page=2&pageSize=1')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(
        pageRes.body.data.map((it: { id: string }) => it.id),
      ).toStrictEqual([activeFacultyId])

      const activeRes = await request(app.getHttpServer())
        .get('/lecturer-titles?activeOnly=true')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(
        activeRes.body.data.map((it: { id: string }) => it.id),
      ).toStrictEqual([activeProgramId, activeFacultyId])

      const lecturerRes = await request(app.getHttpServer())
        .get(`/lecturer-titles?lecturerId=${lecturerTwo.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(
        lecturerRes.body.data.map((it: { id: string }) => it.id),
      ).toStrictEqual([activeFacultyId])

      const programRes = await request(app.getHttpServer())
        .get(`/lecturer-titles?programId=${program.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(
        programRes.body.data.map((it: { id: string }) => it.id),
      ).toStrictEqual([activeProgramId])
    })

    it('should return 401 when Auth header is missing or invalid', async () => {
      excpectResponseMissingAuth(
        await request(app.getHttpServer()).get('/lecturer-titles'),
      )
      excpectResponseInvalidAuth(
        await request(app.getHttpServer())
          .get('/lecturer-titles')
          .set('Authorization', 'Bearer invalid'),
      )
    })
  })

  describe('/GET lecturer-titles/:id', () => {
    let created: { id: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturer_titles" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      created = res.body.data
    })

    it('should return 200 when found and 404 when missing', async () => {
      const ok = await request(app.getHttpServer())
        .get(`/lecturer-titles/${created.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(ok.statusCode).toBe(200)
      expect(ok.body.data).toMatchObject(created)

      const notFound = await request(app.getHttpServer())
        .get('/lecturer-titles/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(notFound.statusCode).toBe(404)
    })

    it('should return 401 when Auth header is missing or invalid', async () => {
      excpectResponseMissingAuth(
        await request(app.getHttpServer()).get(
          `/lecturer-titles/${created.id}`,
        ),
      )
      excpectResponseInvalidAuth(
        await request(app.getHttpServer())
          .get(`/lecturer-titles/${created.id}`)
          .set('Authorization', 'Bearer invalid'),
      )
    })
  })

  describe('/PUT lecturer-titles/:id', () => {
    let created: { id: string }
    let otherActive: { id: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturer_titles" RESTART IDENTITY CASCADE`,
      )
      const r1 = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      created = r1.body.data

      const r2 = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerTwo.id,
          titleId: facultyTitle.id,
          facultyId: otherFaculty.id,
          startDate: '2026-01-01',
        })
      otherActive = r2.body.data
    })

    it('should update and auto-end active holder on rotated seat', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lecturer-titles/${created.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: otherFaculty.id,
          startDate: '2026-04-01',
          endDate: null,
        })

      expect(response.statusCode).toBe(200)
      expect(response.body.data).toMatchObject({
        id: created.id,
        facultyId: otherFaculty.id,
        startDate: '2026-04-01',
        endDate: null,
      })

      const endedOther = await request(app.getHttpServer())
        .get(`/lecturer-titles/${otherActive.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(endedOther.body.data.endDate).toBe('2026-04-01')
    })

    it('should return 422 when endDate < startDate and 404 when id is missing', async () => {
      const invalidRes = await request(app.getHttpServer())
        .put(`/lecturer-titles/${created.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-06-01',
          endDate: '2026-01-01',
        })
      expect(invalidRes.statusCode).toBe(422)

      const notFoundRes = await request(app.getHttpServer())
        .put('/lecturer-titles/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      expect(notFoundRes.statusCode).toBe(404)
    })

    it('should return 401 when Auth header is missing or invalid', async () => {
      excpectResponseMissingAuth(
        await request(app.getHttpServer())
          .put(`/lecturer-titles/${created.id}`)
          .send({
            lecturerId: lecturerOne.id,
            titleId: facultyTitle.id,
            facultyId: faculty.id,
            startDate: '2026-01-01',
          }),
      )
      excpectResponseInvalidAuth(
        await request(app.getHttpServer())
          .put(`/lecturer-titles/${created.id}`)
          .set('Authorization', 'Bearer invalid')
          .send({
            lecturerId: lecturerOne.id,
            titleId: facultyTitle.id,
            facultyId: faculty.id,
            startDate: '2026-01-01',
          }),
      )
    })
  })

  describe('/DELETE lecturer-titles/:id', () => {
    let toBeDeleted: { id: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturer_titles" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/lecturer-titles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lecturerId: lecturerOne.id,
          titleId: facultyTitle.id,
          facultyId: faculty.id,
          startDate: '2026-01-01',
        })
      toBeDeleted = res.body.data
    })

    it('should return 204 for existing and non-existing assignment', async () => {
      const res1 = await request(app.getHttpServer())
        .delete(`/lecturer-titles/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res1.statusCode).toBe(204)
      expect(res1.body).toStrictEqual({})

      const res2 = await request(app.getHttpServer())
        .delete(`/lecturer-titles/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res2.statusCode).toBe(204)
      expect(res2.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing or invalid', async () => {
      excpectResponseMissingAuth(
        await request(app.getHttpServer()).delete('/lecturer-titles/nothing'),
      )
      excpectResponseInvalidAuth(
        await request(app.getHttpServer())
          .delete('/lecturer-titles/nothing')
          .set('Authorization', 'Bearer invalid'),
      )
    })
  })
})
