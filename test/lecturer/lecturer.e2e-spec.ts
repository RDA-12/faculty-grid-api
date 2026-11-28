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

describe('Lecturer', () => {
  let dataSource: DataSource
  let accessToken: string
  let app: INestApplication
  let program: { id: string }
  let otherProgram: { id: string }
  let asnRank: { id: string }
  let militaryRank: { id: string }
  let functionalRank: { id: string }

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
        name: 'Mechanical Engineering',
        degreeLevel: 'master',
        facultyId,
      })
    otherProgram = otherProgramRes.body.data

    const asnRankRes = await request(app.getHttpServer())
      .post('/ranks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Penata Muda (III/a)', type: 'asn' })
    asnRank = asnRankRes.body.data

    const militaryRankRes = await request(app.getHttpServer())
      .post('/ranks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Mayor', type: 'military' })
    militaryRank = militaryRankRes.body.data

    const functionalRankRes = await request(app.getHttpServer())
      .post('/functional-ranks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Lektor' })
    functionalRank = functionalRankRes.body.data
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST lecturers', () => {
    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturers" RESTART IDENTITY CASCADE`,
      )
    })

    it('should return 201 for ASN lecturer with matching ASN rank', async () => {
      const payload = {
        name: 'Budi Santoso',
        displayName: 'Dr. Budi Santoso, S.T., M.T.',
        programId: program.id,
        employmentStatus: 'asn',
        rankId: asnRank.id,
        functionalRankId: functionalRank.id,
        academicDegree: 'doctorate',
      }

      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: payload,
      })
    })

    it('should return 201 for military lecturer with matching military rank', async () => {
      const payload = {
        name: 'Andi Wijaya',
        displayName: 'Mayor Inf. Andi Wijaya, M.T.',
        programId: program.id,
        employmentStatus: 'military',
        rankId: militaryRank.id,
        academicDegree: 'master',
      }

      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          ...payload,
          functionalRankId: null,
        },
      })
    })

    it('should return 201 for contract lecturer without rankId', async () => {
      const payload = {
        name: 'Siti Aminah',
        displayName: 'Siti Aminah, S.Kom.',
        programId: program.id,
        employmentStatus: 'contract',
        academicDegree: 'bachelor',
      }

      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          ...payload,
          rankId: null,
          functionalRankId: null,
        },
      })
    })

    it('should return 201 for contract lecturer with an existing rank', async () => {
      const payload = {
        name: 'Siti Aminah',
        displayName: 'Siti Aminah, M.Kom.',
        programId: program.id,
        employmentStatus: 'contract',
        rankId: militaryRank.id,
        academicDegree: 'master',
      }

      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        status: 201,
        data: {
          ...payload,
          functionalRankId: null,
        },
      })
    })

    it('should return 422 when displayName is missing or empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Siti Aminah',
          displayName: '',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'displayName',
            value: '',
          },
        ],
      })
    })

    it('should return 422 when rankId is omitted for ASN lecturer', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: program.id,
          employmentStatus: 'asn',
          academicDegree: 'doctorate',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'rankId',
          },
        ],
      })
    })

    it('should return 422 when rank type mismatches employmentStatus', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: program.id,
          employmentStatus: 'asn',
          rankId: militaryRank.id,
          academicDegree: 'doctorate',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'rankId',
            value: militaryRank.id,
          },
        ],
      })
    })

    it('should return 404 when programId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: 'not-found',
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 404 when rankId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: program.id,
          employmentStatus: 'asn',
          rankId: 'not-found',
          academicDegree: 'doctorate',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 404 when functionalRankId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          functionalRankId: 'not-found',
          academicDegree: 'bachelor',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({
        status: 404,
      })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', 'Bearer invalid')
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET lecturers', () => {
    const expected: Array<Record<string, unknown>> = []

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturers" RESTART IDENTITY CASCADE`,
      )
      const payloads = [
        {
          name: 'Lecturer 0',
          displayName: 'Dr. Lecturer 0, S.T., M.T.',
          programId: program.id,
          employmentStatus: 'asn',
          rankId: asnRank.id,
          functionalRankId: functionalRank.id,
          academicDegree: 'doctorate',
        },
        {
          name: 'Lecturer 1',
          displayName: 'Mayor Lecturer 1, M.T.',
          programId: otherProgram.id,
          employmentStatus: 'military',
          rankId: militaryRank.id,
          academicDegree: 'master',
        },
        {
          name: 'Lecturer 2',
          displayName: 'Lecturer 2, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        },
      ]
      for (const payload of payloads) {
        const res = await request(app.getHttpServer())
          .post('/lecturers')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payload)
        expected.unshift(res.body.data)
      }
    })

    it('should return 200 with lecturers', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecturers')
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

    it('should return paginated lecturers', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecturers?page=2&pageSize=1')
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

    it('should filter by programId, employmentStatus, rankId, functionalRankId, academicDegree, and search (name or displayName)', async () => {
      const resProgram = await request(app.getHttpServer())
        .get(`/lecturers?programId=${otherProgram.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resProgram.body.data).toStrictEqual([expected[1]])

      const resStatus = await request(app.getHttpServer())
        .get('/lecturers?employmentStatus=contract')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resStatus.body.data).toStrictEqual([expected[0]])

      const resRank = await request(app.getHttpServer())
        .get(`/lecturers?rankId=${militaryRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resRank.body.data).toStrictEqual([expected[1]])

      const resFuncRank = await request(app.getHttpServer())
        .get(`/lecturers?functionalRankId=${functionalRank.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resFuncRank.body.data).toStrictEqual([expected[2]])

      const resDegree = await request(app.getHttpServer())
        .get('/lecturers?academicDegree=bachelor')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resDegree.body.data).toStrictEqual([expected[0]])

      const resSearchName = await request(app.getHttpServer())
        .get('/lecturers?search=Lecturer 0')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resSearchName.body.data).toStrictEqual([expected[2]])

      const resSearchDisplayName = await request(app.getHttpServer())
        .get('/lecturers?search=Mayor')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(resSearchDisplayName.body.data).toStrictEqual([expected[1]])
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get('/lecturers')

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecturers')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/GET lecturers/:id', () => {
    let createdLecturer: { id: string }

    beforeAll(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturers" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: program.id,
          employmentStatus: 'asn',
          rankId: asnRank.id,
          academicDegree: 'doctorate',
        })
      createdLecturer = res.body.data
    })

    it('should return 200 when lecturer found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lecturers/${createdLecturer.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: createdLecturer,
      })
    })

    it('should return 404 when lecturer is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecturers/not-found')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).get(
        `/lecturers/${createdLecturer.id}`,
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lecturers/${createdLecturer.id}`)
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/PUT lecturers/:id', () => {
    let createdLecturer: { id: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturers" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: program.id,
          employmentStatus: 'asn',
          rankId: asnRank.id,
          functionalRankId: functionalRank.id,
          academicDegree: 'doctorate',
        })
      createdLecturer = res.body.data
    })

    it('should return 200 with updated lecturer and persist cleared nullable fields', async () => {
      const updatePayload = {
        name: 'Budi Santoso Updated',
        displayName: 'Budi Santoso, M.T.',
        programId: otherProgram.id,
        employmentStatus: 'contract',
        rankId: null,
        functionalRankId: null,
        academicDegree: 'master',
      }

      const response = await request(app.getHttpServer())
        .put(`/lecturers/${createdLecturer.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        status: 200,
        data: {
          id: createdLecturer.id,
          ...updatePayload,
        },
      })

      const getRes = await request(app.getHttpServer())
        .get(`/lecturers/${createdLecturer.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(getRes.body.data).toMatchObject({
        id: createdLecturer.id,
        ...updatePayload,
      })
    })

    it('should return 422 when updating to mismatched rank type', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lecturers/${createdLecturer.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: program.id,
          employmentStatus: 'military',
          rankId: asnRank.id,
          academicDegree: 'doctorate',
        })

      expect(response.statusCode).toBe(422)
      expect(response.body).toMatchObject({
        status: 422,
        errors: [
          {
            property: 'rankId',
            value: asnRank.id,
          },
        ],
      })
    })

    it('should return 404 when lecturer is not found', async () => {
      const response = await request(app.getHttpServer())
        .put('/lecturers/not-found')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })

      expect(response.statusCode).toBe(404)
      expect(response.body).toMatchObject({ status: 404 })
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lecturers/${createdLecturer.id}`)
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lecturers/${createdLecturer.id}`)
        .set('Authorization', 'Bearer invalid')
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })

      excpectResponseInvalidAuth(response)
    })
  })

  describe('/DELETE lecturers/:id', () => {
    let toBeDeleted: { id: string }

    beforeEach(async () => {
      await dataSource.query(
        `TRUNCATE TABLE "lecturers" RESTART IDENTITY CASCADE`,
      )
      const res = await request(app.getHttpServer())
        .post('/lecturers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Siti Aminah',
          displayName: 'Siti Aminah, S.Kom.',
          programId: program.id,
          employmentStatus: 'contract',
          academicDegree: 'bachelor',
        })
      toBeDeleted = res.body.data
    })

    it('should return 204 when deleting existing lecturer', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/lecturers/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 204 when deleting non-existing lecturer', async () => {
      await request(app.getHttpServer())
        .delete(`/lecturers/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const response = await request(app.getHttpServer())
        .delete(`/lecturers/${toBeDeleted.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(204)
      expect(response.body).toStrictEqual({})
    })

    it('should return 401 when Auth header is missing', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/lecturers/nothing',
      )

      excpectResponseMissingAuth(response)
    })

    it('should return 401 when Auth header is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/lecturers/nothing')
        .set('Authorization', 'Bearer invalid')

      excpectResponseInvalidAuth(response)
    })
  })
})
