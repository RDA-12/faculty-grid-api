import { Test } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { AppResult } from '../../common/app-result.js'
import { NotFoundException } from '../../common/app-exception.js'
import { FacultyRepository } from './faculty.repository.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import { Faculty } from '../entities/faculty.entity.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import { ProgramDBEntity } from '../../common/database/entities/program.entity.js'
import { ProgramDegreeLevel } from '../entities/program.entity.js'

describe('FacultyRepository', () => {
  let userDb: UserDBEntity
  let dataSource: DataSource
  let facultyRepository: FacultyRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        FacultyRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'name'
    insertUserDb.email = 'email'
    userDb = await dataSource.manager.save(insertUserDb)

    facultyRepository = moduleRef.get(FacultyRepository)
  })

  beforeEach(async () => {
    for (const entity of dataSource.entityMetadatas) {
      if (entity.tableName === 'users') continue
      await dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      )
    }
  })

  describe('save', () => {
    it('should return and save correct faculty', async () => {
      const result = await facultyRepository.save('name', userDb.id)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: 'name',
      })

      const row = await dataSource.manager.findOneBy(FacultyDBEntity, {
        id: result.data!.id,
      })
      expect(row?.name).toBe('name')
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should return failed with NotFoundException when user is not found', async () => {
      const result = await facultyRepository.save('name', 'not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(`user with ID not-found is not found`),
        ),
      )
    })
  })

  describe('getAll', () => {
    let expected: Faculty[] = []

    beforeEach(async () => {
      const newData: Faculty[] = []
      for (var i = 0; i < 5; i++) {
        const facultyInsertDB = new FacultyDBEntity()
        facultyInsertDB.name = `faculty ${i}`
        facultyInsertDB.createdBy = userDb.id
        facultyInsertDB.createdAt = new Date(2026, 11, 1 + i)
        const facultyDB = await dataSource.manager.save(facultyInsertDB)
        newData.unshift(facultyDB.toDomain())
      }
      expected = newData
    })

    it('should return correct faculties', async () => {
      const result = await facultyRepository.getAll()

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

    it('should return correct paginated faculties', async () => {
      const result = await facultyRepository.getAll(
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
  })

  describe('deleteById', () => {
    let toBeDeleted: FacultyDBEntity

    beforeEach(async () => {
      for (var i = 0; i < 5; i++) {
        const facultyInsertDB = new FacultyDBEntity()
        facultyInsertDB.name = `faculty ${i}`
        facultyInsertDB.createdBy = userDb.id
        const facultyDB = await dataSource.manager.save(facultyInsertDB)
        if (i === i) {
          toBeDeleted = facultyDB
        }
      }
    })

    it('should soft remove correct faculty', async () => {
      const result = await facultyRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const rows = await dataSource.manager.find(FacultyDBEntity, {
        withDeleted: true,
      })
      expect(rows.map((it) => it.id).includes(toBeDeleted.id)).toBeTruthy()
    })

    it('should soft remove its programs too', async () => {
      const programDb = new ProgramDBEntity()
      programDb.name = 'program 1'
      programDb.degreeLevel = ProgramDegreeLevel.bachelor
      programDb.facultyId = toBeDeleted.id
      programDb.createdBy = userDb.id
      await dataSource.manager.save(programDb)

      await facultyRepository.deleteById(toBeDeleted.id)

      const rows = await dataSource.manager.find(ProgramDBEntity)
      expect(rows.length).toBe(0)
    })
  })
})
