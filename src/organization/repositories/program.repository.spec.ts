import { DataSource } from 'typeorm'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { ProgramRepository } from './program.repository.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import { Test } from '@nestjs/testing'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { CreateProgramParams } from '../user-cases/create-program.use-case.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramDBEntity } from '../../common/database/entities/program.entity.js'
import { AppResult } from '../../common/app-result.js'
import { NotFoundException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import { GetProgramsParams } from '../user-cases/get-programs.use-case.js'

describe('ProgramRepository', () => {
  let params: CreateProgramParams
  let userDb: UserDBEntity
  let facultyDb: FacultyDBEntity
  let dataSource: DataSource
  let programRepository: ProgramRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        ProgramRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'name'
    insertUserDb.email = 'email'
    userDb = await dataSource.manager.save(insertUserDb)

    const insertFacultyDb = new FacultyDBEntity()
    insertFacultyDb.name = 'new faculty'
    insertFacultyDb.createdBy = userDb.id
    facultyDb = await dataSource.manager.save(insertFacultyDb)

    programRepository = moduleRef.get(ProgramRepository)
  })

  beforeEach(async () => {
    for (const entity of dataSource.entityMetadatas) {
      if (['users', 'faculties'].includes(entity.tableName)) continue
      await dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      )
    }
  })

  describe('save', () => {
    beforeEach(() => {
      params = new CreateProgramParams({
        name: 'program',
        degreeLevel: ProgramDegreeLevel.bachelor,
        facultyId: facultyDb.id,
        createdBy: userDb.id,
      })
    })

    it('should return and save correct program', async () => {
      const result = await programRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: params.name,
        degreeLevel: params.degreeLevel,
        facultyId: params.facultyId,
      })

      const row = await dataSource.manager.findOneBy(ProgramDBEntity, {
        id: result.data!.id,
      })
      expect(row?.name).toBe(params.name)
      expect(row?.degreeLevel).toBe(params.degreeLevel)
      expect(row?.facultyId).toBe(params.facultyId)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should return failed with NotFoundException when user is not found', async () => {
      const result = await programRepository.save(
        new CreateProgramParams({
          name: params.name,
          degreeLevel: params.degreeLevel,
          facultyId: params.facultyId,
          createdBy: 'not-found',
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `faculty with ID ${params.facultyId} or user with ID not-found is not found`,
          ),
        ),
      )
    })

    it('should return failed with NotFoundException when faculty is not found', async () => {
      const result = await programRepository.save(
        new CreateProgramParams({
          name: params.name,
          degreeLevel: params.degreeLevel,
          facultyId: 'not-found',
          createdBy: params.createdBy,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `faculty with ID not-found or user with ID ${params.createdBy} is not found`,
          ),
        ),
      )
    })
  })

  describe('getAll', () => {
    let expected: Program[] = []

    beforeEach(async () => {
      const newData: Program[] = []
      for (var i = 0; i < 5; i++) {
        const programInsertDB = new ProgramDBEntity()
        programInsertDB.name = `program ${i}`
        programInsertDB.createdBy = userDb.id
        programInsertDB.createdAt = new Date(2026, 11, 1 + i)
        programInsertDB.facultyId = facultyDb.id
        programInsertDB.degreeLevel = ProgramDegreeLevel.bachelor
        const programDB = await dataSource.manager.save(programInsertDB)
        newData.unshift(programDB.toDomain())
      }
      expected = newData
    })

    it('should return correct programs', async () => {
      const result = await programRepository.getAll()

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 5,
            }),
          }),
        ),
      )
    })

    it('should return correct paginated programs', async () => {
      const result = await programRepository.getAll(
        new Pagination({ pageSize: 1 }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: [expected[0]],
            pagination: new PaginationResult({
              page: 1,
              pageSize: 1,
              total: 5,
            }),
          }),
        ),
      )
    })

    it('should return correct filtered programs by facultyId', async () => {
      const result = await programRepository.getAll(
        new GetProgramsParams({ facultyId: 'id' }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: [],
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 0,
            }),
          }),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: ProgramDBEntity

    beforeEach(async () => {
      for (var i = 0; i < 5; i++) {
        const programInsertDB = new ProgramDBEntity()
        programInsertDB.name = `program ${i}`
        programInsertDB.degreeLevel = ProgramDegreeLevel.bachelor
        programInsertDB.createdBy = userDb.id
        programInsertDB.facultyId = facultyDb.id
        const programDB = await dataSource.manager.save(programInsertDB)
        if (i === i) {
          toBeDeleted = programDB
        }
      }
    })

    it('should soft remove correct program', async () => {
      const result = await programRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const rows = await dataSource.manager.find(ProgramDBEntity, {
        withDeleted: true,
      })
      expect(rows.map((it) => it.id).includes(toBeDeleted.id)).toBeTruthy()
    })
  })
})
