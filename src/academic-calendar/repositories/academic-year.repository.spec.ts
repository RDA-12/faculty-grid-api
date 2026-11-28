import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { AcademicYearDBEntity } from '../../common/database/entities/academic-year.entity.js'
import { formatDateOnly } from '../../common/database/entities/common.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { AcademicYearRepository } from './academic-year.repository.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { CreateAcademicYearParams } from '../use-cases/create-academic-year.use-case.js'
import { GetAcademicYearsParams } from '../use-cases/get-academic-years.use-case.js'
import { UpdateAcademicYearParams } from '../use-cases/update-academic-year.use-case.js'
import { AppResult } from '../../common/app-result.js'
import {
  AlreadyExistsException,
  ConflictException,
  NotFoundException,
} from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('AcademicYearRepository', () => {
  let params: CreateAcademicYearParams
  let userDb: UserDBEntity
  let dataSource: DataSource
  let academicYearRepository: AcademicYearRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        AcademicYearRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'Admin User'
    insertUserDb.email = 'admin@example.com'
    userDb = await dataSource.manager.save(insertUserDb)

    academicYearRepository = moduleRef.get(AcademicYearRepository)
  })

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "academic_years" RESTART IDENTITY CASCADE`,
    )
  })

  describe('save', () => {
    beforeEach(() => {
      params = new CreateAcademicYearParams({
        name: '2026/2027',
        startDate: '2026-08-01',
        endDate: '2027-07-31',
        createdBy: userDb.id,
      })
    })

    it('should save academic year with planned status by default', async () => {
      const result = await academicYearRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: params.name,
        startDate: params.startDate,
        endDate: params.endDate,
        status: AcademicYearStatus.planned,
      })

      const row = await dataSource.manager.findOneBy(AcademicYearDBEntity, {
        id: result.data!.id,
      })
      expect(row?.name).toBe(params.name)
      expect(formatDateOnly(row!.startDate)).toBe(params.startDate)
      expect(formatDateOnly(row!.endDate)).toBe(params.endDate)
      expect(row?.status).toBe(AcademicYearStatus.planned)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should save academic year with explicit active status', async () => {
      const result = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: params.name,
          startDate: params.startDate,
          endDate: params.endDate,
          status: AcademicYearStatus.active,
          createdBy: params.createdBy,
        }),
      )

      expect(result.data?.status).toBe(AcademicYearStatus.active)
    })

    it('should return AlreadyExistsException when saving duplicate name', async () => {
      await academicYearRepository.save(params)

      const duplicate = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: params.name,
          startDate: '2027-08-01',
          endDate: '2028-07-31',
          createdBy: params.createdBy,
        }),
      )

      expect(duplicate).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `academic year with name ${params.name} already exists`,
          ),
        ),
      )
    })

    it('should allow reusing name after soft-deleting previous academic year', async () => {
      const first = await academicYearRepository.save(params)
      await academicYearRepository.deleteById(first.data!.id)

      const second = await academicYearRepository.save(params)

      expect(second.data).not.toBeNull()
      expect(second.data?.id).not.toBe(first.data!.id)
      expect(second.data?.name).toBe(params.name)
    })

    it('should return ConflictException when saving a second active academic year', async () => {
      await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2025/2026',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: AcademicYearStatus.active,
          createdBy: userDb.id,
        }),
      )

      const secondActive = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.active,
          createdBy: userDb.id,
        }),
      )

      expect(secondActive).toStrictEqual(
        AppResult.failed(
          new ConflictException('an active academic year already exists'),
        ),
      )
    })

    it('should allow creating a new active academic year after previous active is archived or soft-deleted', async () => {
      const first = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2024/2025',
          startDate: '2024-08-01',
          endDate: '2025-07-31',
          status: AcademicYearStatus.active,
          createdBy: userDb.id,
        }),
      )
      await academicYearRepository.update(
        new UpdateAcademicYearParams({
          id: first.data!.id,
          name: first.data!.name,
          startDate: first.data!.startDate,
          endDate: first.data!.endDate,
          status: AcademicYearStatus.archived,
        }),
      )

      const second = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2025/2026',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: AcademicYearStatus.active,
          createdBy: userDb.id,
        }),
      )
      expect(second.data?.status).toBe(AcademicYearStatus.active)

      await academicYearRepository.deleteById(second.data!.id)

      const third = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.active,
          createdBy: userDb.id,
        }),
      )
      expect(third.data?.status).toBe(AcademicYearStatus.active)
    })

    it('should return ConflictException when date range overlaps (partial, containment, or touching endpoint)', async () => {
      await academicYearRepository.save(params)

      const partialOverlap = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2027/2028 Partial',
          startDate: '2027-07-01',
          endDate: '2028-06-30',
          createdBy: userDb.id,
        }),
      )
      expect(partialOverlap.exception).toBeInstanceOf(ConflictException)

      const containedOverlap = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2026/2027 Contained',
          startDate: '2026-09-01',
          endDate: '2027-05-01',
          createdBy: userDb.id,
        }),
      )
      expect(containedOverlap.exception).toBeInstanceOf(ConflictException)

      const touchingEndpoint = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2027/2028 Touching',
          startDate: '2027-07-31',
          endDate: '2028-07-30',
          createdBy: userDb.id,
        }),
      )
      expect(touchingEndpoint.exception).toBeInstanceOf(ConflictException)
    })

    it('should allow adjacent non-overlapping academic years', async () => {
      await academicYearRepository.save(params)

      const adjacent = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2027/2028',
          startDate: '2027-08-01',
          endDate: '2028-07-31',
          createdBy: userDb.id,
        }),
      )

      expect(adjacent.data).not.toBeNull()
      expect(adjacent.data?.name).toBe('2027/2028')
    })

    it('should allow date range overlapping with a soft-deleted academic year', async () => {
      const first = await academicYearRepository.save(params)
      await academicYearRepository.deleteById(first.data!.id)

      const overlappingNew = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: '2026/2027 Revised',
          startDate: params.startDate,
          endDate: params.endDate,
          createdBy: userDb.id,
        }),
      )

      expect(overlappingNew.data).not.toBeNull()
      expect(overlappingNew.data?.name).toBe('2026/2027 Revised')
    })

    it('should return NotFoundException when createdBy does not exist', async () => {
      const result = await academicYearRepository.save(
        new CreateAcademicYearParams({
          name: params.name,
          startDate: params.startDate,
          endDate: params.endDate,
          createdBy: 'not-found',
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('user with ID not-found is not found'),
        ),
      )
    })
  })

  describe('getAll', () => {
    let expected: AcademicYear[] = []

    beforeEach(async () => {
      const specs = [
        {
          name: '2025/2026',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: AcademicYearStatus.archived,
        },
        {
          name: '2027/2028',
          startDate: '2027-08-01',
          endDate: '2028-07-31',
          status: AcademicYearStatus.planned,
        },
        {
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.active,
        },
      ]
      const savedList: AcademicYear[] = []
      for (let i = 0; i < specs.length; i++) {
        const db = new AcademicYearDBEntity({
          ...specs[i],
          createdBy: userDb.id,
          createdAt: new Date(2026, 11, 1 + i),
        })
        const saved = await dataSource.manager.save(db)
        savedList.push(saved.toDomain())
      }
      expected = [savedList[1], savedList[2], savedList[0]]
    })

    it('should return all academic years ordered by start_date DESC', async () => {
      const result = await academicYearRepository.getAll()

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 3,
            }),
          }),
        ),
      )
    })

    it('should return paginated academic years', async () => {
      const result = await academicYearRepository.getAll(
        new Pagination({ page: 2, pageSize: 1 }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: [expected[1]],
            pagination: new PaginationResult({
              page: 2,
              pageSize: 1,
              total: 3,
            }),
          }),
        ),
      )
    })

    it('should filter academic years by status', async () => {
      const filtered = expected.filter(
        (it) => it.status === AcademicYearStatus.active,
      )
      const result = await academicYearRepository.getAll(
        new GetAcademicYearsParams({ status: AcademicYearStatus.active }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: filtered,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: filtered.length,
            }),
          }),
        ),
      )
    })

    it('should filter academic years by search on name', async () => {
      const filtered = expected.filter((it) => it.name === '2026/2027')
      const result = await academicYearRepository.getAll(
        new GetAcademicYearsParams({ search: '2026/2027' }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: filtered,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: filtered.length,
            }),
          }),
        ),
      )
    })
  })

  describe('getById', () => {
    let savedAcademicYear: AcademicYearDBEntity

    beforeEach(async () => {
      savedAcademicYear = await dataSource.manager.save(
        new AcademicYearDBEntity({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.planned,
          createdBy: userDb.id,
        }),
      )
    })

    it('should return academic year when found', async () => {
      const result = await academicYearRepository.getById(savedAcademicYear.id)

      expect(result).toStrictEqual(
        AppResult.success(savedAcademicYear.toDomain()),
      )
    })

    it('should return NotFoundException when academic year is not found', async () => {
      const result = await academicYearRepository.getById('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('academic year with ID not-found is not found'),
        ),
      )
    })
  })

  describe('update', () => {
    let savedYear: AcademicYearDBEntity
    let otherYear: AcademicYearDBEntity

    beforeEach(async () => {
      savedYear = await dataSource.manager.save(
        new AcademicYearDBEntity({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.planned,
          createdBy: userDb.id,
        }),
      )
      otherYear = await dataSource.manager.save(
        new AcademicYearDBEntity({
          name: '2025/2026',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: AcademicYearStatus.active,
          createdBy: userDb.id,
        }),
      )
    })

    it('should update own record without self-overlap or duplicate-name conflict', async () => {
      const result = await academicYearRepository.update(
        new UpdateAcademicYearParams({
          id: savedYear.id,
          name: savedYear.name,
          startDate: '2026-08-15',
          endDate: '2027-07-15',
          status: AcademicYearStatus.archived,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new AcademicYear({
            id: savedYear.id,
            name: savedYear.name,
            startDate: '2026-08-15',
            endDate: '2027-07-15',
            status: AcademicYearStatus.archived,
          }),
        ),
      )

      const row = await dataSource.manager.findOneBy(AcademicYearDBEntity, {
        id: savedYear.id,
      })
      expect(formatDateOnly(row!.startDate)).toBe('2026-08-15')
      expect(formatDateOnly(row!.endDate)).toBe('2027-07-15')
      expect(row?.status).toBe(AcademicYearStatus.archived)
    })

    it('should allow updating an active record while keeping status active', async () => {
      const result = await academicYearRepository.update(
        new UpdateAcademicYearParams({
          id: otherYear.id,
          name: '2025/2026 Updated',
          startDate: '2025-08-01',
          endDate: '2026-07-31',
          status: AcademicYearStatus.active,
        }),
      )

      expect(result.data).toMatchObject({
        id: otherYear.id,
        name: '2025/2026 Updated',
        status: AcademicYearStatus.active,
      })
    })

    it('should return AlreadyExistsException when updating to duplicate name', async () => {
      const result = await academicYearRepository.update(
        new UpdateAcademicYearParams({
          id: savedYear.id,
          name: otherYear.name,
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.planned,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `academic year with name ${otherYear.name} already exists`,
          ),
        ),
      )
    })

    it('should return ConflictException when updating to active while another is already active', async () => {
      const result = await academicYearRepository.update(
        new UpdateAcademicYearParams({
          id: savedYear.id,
          name: savedYear.name,
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.active,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new ConflictException('an active academic year already exists'),
        ),
      )
    })

    it('should return ConflictException when updating to overlapping date range with another academic year', async () => {
      const result = await academicYearRepository.update(
        new UpdateAcademicYearParams({
          id: savedYear.id,
          name: savedYear.name,
          startDate: '2026-07-15',
          endDate: '2027-07-31',
          status: AcademicYearStatus.planned,
        }),
      )

      expect(result.exception).toBeInstanceOf(ConflictException)
    })

    it('should return NotFoundException when academic year is not found', async () => {
      const result = await academicYearRepository.update(
        new UpdateAcademicYearParams({
          id: 'not-found',
          name: '2028/2029',
          startDate: '2028-08-01',
          endDate: '2029-07-31',
          status: AcademicYearStatus.planned,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('academic year with ID not-found is not found'),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: AcademicYearDBEntity

    beforeEach(async () => {
      toBeDeleted = await dataSource.manager.save(
        new AcademicYearDBEntity({
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.planned,
          createdBy: userDb.id,
        }),
      )
    })

    it('should soft remove correct academic year', async () => {
      const result = await academicYearRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(
        AcademicYearDBEntity,
        {
          id: toBeDeleted.id,
        },
      )
      expect(activeRow).toBeNull()

      const deletedRow = await dataSource.manager.findOne(
        AcademicYearDBEntity,
        {
          where: { id: toBeDeleted.id },
          withDeleted: true,
        },
      )
      expect(deletedRow?.deletedAt).not.toBeNull()
    })

    it('should return success when deleting non-existing academic year', async () => {
      const result = await academicYearRepository.deleteById('not-found')

      expect(result).toStrictEqual(AppResult.success(null))
    })
  })
})
