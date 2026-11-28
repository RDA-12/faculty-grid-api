import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { AcademicYearDBEntity } from '../../common/database/entities/academic-year.entity.js'
import { TermDBEntity } from '../../common/database/entities/term.entity.js'
import { formatDateOnly } from '../../common/database/entities/common.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { TermRepository } from './term.repository.js'
import { AcademicYearStatus } from '../entities/academic-year.entity.js'
import { Term, TermStatus } from '../entities/term.entity.js'
import { CreateTermParams } from '../use-cases/create-term.use-case.js'
import { GetTermsParams } from '../use-cases/get-terms.use-case.js'
import { UpdateTermParams } from '../use-cases/update-term.use-case.js'
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

describe('TermRepository', () => {
  let params: CreateTermParams
  let userDb: UserDBEntity
  let yearDb: AcademicYearDBEntity
  let otherYearDb: AcademicYearDBEntity
  let dataSource: DataSource
  let termRepository: TermRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        TermRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'Admin User'
    insertUserDb.email = 'admin@example.com'
    userDb = await dataSource.manager.save(insertUserDb)

    yearDb = await dataSource.manager.save(
      new AcademicYearDBEntity({
        name: '2026/2027',
        startDate: '2026-08-01',
        endDate: '2027-07-31',
        status: AcademicYearStatus.active,
        createdBy: userDb.id,
      }),
    )
    otherYearDb = await dataSource.manager.save(
      new AcademicYearDBEntity({
        name: '2027/2028',
        startDate: '2027-08-01',
        endDate: '2028-07-31',
        status: AcademicYearStatus.planned,
        createdBy: userDb.id,
      }),
    )

    termRepository = moduleRef.get(TermRepository)
  })

  beforeEach(async () => {
    await dataSource.query(`TRUNCATE TABLE "terms" RESTART IDENTITY CASCADE`)
  })

  describe('save', () => {
    beforeEach(() => {
      params = new CreateTermParams({
        academicYearId: yearDb.id,
        name: '2026/2027 Odd',
        startDate: '2026-08-01',
        endDate: '2027-01-31',
        createdBy: userDb.id,
      })
    })

    it('should save term with planned status by default', async () => {
      const result = await termRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        academicYearId: params.academicYearId,
        name: params.name,
        startDate: params.startDate,
        endDate: params.endDate,
        status: TermStatus.planned,
      })

      const row = await dataSource.manager.findOneBy(TermDBEntity, {
        id: result.data!.id,
      })
      expect(row?.academicYearId).toBe(params.academicYearId)
      expect(row?.name).toBe(params.name)
      expect(formatDateOnly(row!.startDate)).toBe(params.startDate)
      expect(formatDateOnly(row!.endDate)).toBe(params.endDate)
      expect(row?.status).toBe(TermStatus.planned)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should save term with explicit active status', async () => {
      const result = await termRepository.save(
        new CreateTermParams({
          academicYearId: params.academicYearId,
          name: params.name,
          startDate: params.startDate,
          endDate: params.endDate,
          status: TermStatus.active,
          createdBy: params.createdBy,
        }),
      )

      expect(result.data?.status).toBe(TermStatus.active)
    })

    it('should return AlreadyExistsException when saving duplicate name in same academic year', async () => {
      await termRepository.save(params)

      const duplicate = await termRepository.save(
        new CreateTermParams({
          academicYearId: params.academicYearId,
          name: params.name,
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          createdBy: params.createdBy,
        }),
      )

      expect(duplicate).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `term with name ${params.name} already exists in academic year ${params.academicYearId}`,
          ),
        ),
      )
    })

    it('should allow saving same name in a different academic year', async () => {
      await termRepository.save(params)

      const otherYearTerm = await termRepository.save(
        new CreateTermParams({
          academicYearId: otherYearDb.id,
          name: params.name,
          startDate: '2027-08-01',
          endDate: '2028-01-31',
          createdBy: params.createdBy,
        }),
      )

      expect(otherYearTerm.data).not.toBeNull()
      expect(otherYearTerm.data?.academicYearId).toBe(otherYearDb.id)
      expect(otherYearTerm.data?.name).toBe(params.name)
    })

    it('should allow reusing name in same academic year after soft-deleting previous term', async () => {
      const first = await termRepository.save(params)
      await termRepository.deleteById(first.data!.id)

      const second = await termRepository.save(params)

      expect(second.data).not.toBeNull()
      expect(second.data?.id).not.toBe(first.data!.id)
      expect(second.data?.name).toBe(params.name)
    })

    it('should return ConflictException when saving a second active term globally', async () => {
      await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.active,
          createdBy: userDb.id,
        }),
      )

      const secondActiveSameYear = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: TermStatus.active,
          createdBy: userDb.id,
        }),
      )
      expect(secondActiveSameYear).toStrictEqual(
        AppResult.failed(
          new ConflictException('an active term already exists'),
        ),
      )

      const secondActiveOtherYear = await termRepository.save(
        new CreateTermParams({
          academicYearId: otherYearDb.id,
          name: '2027/2028 Odd',
          startDate: '2027-08-01',
          endDate: '2028-01-31',
          status: TermStatus.active,
          createdBy: userDb.id,
        }),
      )
      expect(secondActiveOtherYear).toStrictEqual(
        AppResult.failed(
          new ConflictException('an active term already exists'),
        ),
      )
    })

    it('should allow creating a new active term after previous active is archived or soft-deleted', async () => {
      const first = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.active,
          createdBy: userDb.id,
        }),
      )
      await termRepository.update(
        new UpdateTermParams({
          id: first.data!.id,
          academicYearId: first.data!.academicYearId,
          name: first.data!.name,
          startDate: first.data!.startDate,
          endDate: first.data!.endDate,
          status: TermStatus.archived,
        }),
      )

      const second = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: TermStatus.active,
          createdBy: userDb.id,
        }),
      )
      expect(second.data?.status).toBe(TermStatus.active)

      await termRepository.deleteById(second.data!.id)

      const third = await termRepository.save(
        new CreateTermParams({
          academicYearId: otherYearDb.id,
          name: '2027/2028 Odd',
          startDate: '2027-08-01',
          endDate: '2028-01-31',
          status: TermStatus.active,
          createdBy: userDb.id,
        }),
      )
      expect(third.data?.status).toBe(TermStatus.active)
    })

    it('should return ConflictException when date range overlaps in same academic year', async () => {
      await termRepository.save(params)

      const partialOverlap = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: 'Partial',
          startDate: '2027-01-15',
          endDate: '2027-06-30',
          createdBy: userDb.id,
        }),
      )
      expect(partialOverlap.exception).toBeInstanceOf(ConflictException)

      const containedOverlap = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: 'Contained',
          startDate: '2026-09-01',
          endDate: '2026-12-01',
          createdBy: userDb.id,
        }),
      )
      expect(containedOverlap.exception).toBeInstanceOf(ConflictException)

      const touchingEndpoint = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: 'Touching',
          startDate: '2027-01-31',
          endDate: '2027-06-30',
          createdBy: userDb.id,
        }),
      )
      expect(touchingEndpoint.exception).toBeInstanceOf(ConflictException)
    })

    it('should allow adjacent non-overlapping terms in same academic year', async () => {
      await termRepository.save(params)

      const adjacent = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          createdBy: userDb.id,
        }),
      )

      expect(adjacent.data).not.toBeNull()
      expect(adjacent.data?.name).toBe('2026/2027 Even')
    })

    it('should allow overlapping dates across different academic years and with soft-deleted terms', async () => {
      const first = await termRepository.save(params)

      const otherYearSameDates = await termRepository.save(
        new CreateTermParams({
          academicYearId: otherYearDb.id,
          name: 'Other Year Same Dates',
          startDate: params.startDate,
          endDate: params.endDate,
          createdBy: userDb.id,
        }),
      )
      expect(otherYearSameDates.data).not.toBeNull()

      await termRepository.deleteById(first.data!.id)

      const overlappingDeleted = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: '2026/2027 Odd Revised',
          startDate: params.startDate,
          endDate: params.endDate,
          createdBy: userDb.id,
        }),
      )
      expect(overlappingDeleted.data).not.toBeNull()
    })

    it('should return NotFoundException when academicYearId or createdBy does not exist', async () => {
      const missingYear = await termRepository.save(
        new CreateTermParams({
          academicYearId: 'not-found',
          name: params.name,
          startDate: params.startDate,
          endDate: params.endDate,
          createdBy: userDb.id,
        }),
      )
      expect(missingYear).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `academic year with ID not-found or user with ID ${userDb.id} is not found`,
          ),
        ),
      )

      const missingUser = await termRepository.save(
        new CreateTermParams({
          academicYearId: yearDb.id,
          name: params.name,
          startDate: params.startDate,
          endDate: params.endDate,
          createdBy: 'not-found',
        }),
      )
      expect(missingUser).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `academic year with ID ${yearDb.id} or user with ID not-found is not found`,
          ),
        ),
      )
    })
  })

  describe('getAll', () => {
    let expected: Term[] = []

    beforeEach(async () => {
      const specs = [
        {
          academicYearId: yearDb.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.archived,
        },
        {
          academicYearId: otherYearDb.id,
          name: '2027/2028 Odd',
          startDate: '2027-08-01',
          endDate: '2028-01-31',
          status: TermStatus.planned,
        },
        {
          academicYearId: yearDb.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: TermStatus.active,
        },
      ]
      const savedList: Term[] = []
      for (let i = 0; i < specs.length; i++) {
        const db = new TermDBEntity({
          ...specs[i],
          createdBy: userDb.id,
          createdAt: new Date(2026, 11, 1 + i),
        })
        const saved = await dataSource.manager.save(db)
        savedList.push(saved.toDomain())
      }
      expected = [savedList[1], savedList[2], savedList[0]]
    })

    it('should return all terms ordered by start_date DESC', async () => {
      const result = await termRepository.getAll()

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

    it('should return paginated terms', async () => {
      const result = await termRepository.getAll(
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

    it('should filter terms by academicYearId, status, and search', async () => {
      const byYear = await termRepository.getAll(
        new GetTermsParams({ academicYearId: otherYearDb.id }),
      )
      expect(byYear).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected.filter((it) => it.academicYearId === otherYearDb.id),
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 1,
            }),
          }),
        ),
      )

      const byStatus = await termRepository.getAll(
        new GetTermsParams({ status: TermStatus.active }),
      )
      expect(byStatus).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected.filter((it) => it.status === TermStatus.active),
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 1,
            }),
          }),
        ),
      )

      const bySearch = await termRepository.getAll(
        new GetTermsParams({ search: 'Even' }),
      )
      expect(bySearch).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected.filter((it) => it.name.includes('Even')),
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 1,
            }),
          }),
        ),
      )
    })
  })

  describe('getById', () => {
    let savedTerm: TermDBEntity

    beforeEach(async () => {
      savedTerm = await dataSource.manager.save(
        new TermDBEntity({
          academicYearId: yearDb.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.planned,
          createdBy: userDb.id,
        }),
      )
    })

    it('should return term when found', async () => {
      const result = await termRepository.getById(savedTerm.id)

      expect(result).toStrictEqual(AppResult.success(savedTerm.toDomain()))
    })

    it('should return NotFoundException when term is not found', async () => {
      const result = await termRepository.getById('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('term with ID not-found is not found'),
        ),
      )
    })
  })

  describe('update', () => {
    let savedTerm: TermDBEntity
    let otherTerm: TermDBEntity

    beforeEach(async () => {
      savedTerm = await dataSource.manager.save(
        new TermDBEntity({
          academicYearId: yearDb.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.planned,
          createdBy: userDb.id,
        }),
      )
      otherTerm = await dataSource.manager.save(
        new TermDBEntity({
          academicYearId: yearDb.id,
          name: '2026/2027 Even',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: TermStatus.active,
          createdBy: userDb.id,
        }),
      )
    })

    it('should update own record without self-overlap or duplicate-name conflict', async () => {
      const result = await termRepository.update(
        new UpdateTermParams({
          id: savedTerm.id,
          academicYearId: savedTerm.academicYearId,
          name: savedTerm.name,
          startDate: '2026-08-15',
          endDate: '2027-01-15',
          status: TermStatus.archived,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new Term({
            id: savedTerm.id,
            academicYearId: savedTerm.academicYearId,
            name: savedTerm.name,
            startDate: '2026-08-15',
            endDate: '2027-01-15',
            status: TermStatus.archived,
          }),
        ),
      )
    })

    it('should allow updating an active term while keeping status active', async () => {
      const result = await termRepository.update(
        new UpdateTermParams({
          id: otherTerm.id,
          academicYearId: otherTerm.academicYearId,
          name: '2026/2027 Even Updated',
          startDate: '2027-02-01',
          endDate: '2027-07-31',
          status: TermStatus.active,
        }),
      )

      expect(result.data).toMatchObject({
        id: otherTerm.id,
        name: '2026/2027 Even Updated',
        status: TermStatus.active,
      })
    })

    it('should return AlreadyExistsException when updating to duplicate name in target academic year', async () => {
      const result = await termRepository.update(
        new UpdateTermParams({
          id: savedTerm.id,
          academicYearId: otherTerm.academicYearId,
          name: otherTerm.name,
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.planned,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `term with name ${otherTerm.name} already exists in academic year ${otherTerm.academicYearId}`,
          ),
        ),
      )
    })

    it('should return ConflictException when updating to active while another term is active', async () => {
      const result = await termRepository.update(
        new UpdateTermParams({
          id: savedTerm.id,
          academicYearId: savedTerm.academicYearId,
          name: savedTerm.name,
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.active,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new ConflictException('an active term already exists'),
        ),
      )
    })

    it('should return ConflictException when updating to overlapping date range in target academic year', async () => {
      const result = await termRepository.update(
        new UpdateTermParams({
          id: savedTerm.id,
          academicYearId: savedTerm.academicYearId,
          name: savedTerm.name,
          startDate: '2026-08-01',
          endDate: '2027-02-15',
          status: TermStatus.planned,
        }),
      )

      expect(result.exception).toBeInstanceOf(ConflictException)
    })

    it('should return NotFoundException when term or target academicYearId is not found', async () => {
      const missingTerm = await termRepository.update(
        new UpdateTermParams({
          id: 'not-found',
          academicYearId: yearDb.id,
          name: 'Missing',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.planned,
        }),
      )
      expect(missingTerm).toStrictEqual(
        AppResult.failed(
          new NotFoundException('term with ID not-found is not found'),
        ),
      )

      const missingYear = await termRepository.update(
        new UpdateTermParams({
          id: savedTerm.id,
          academicYearId: 'not-found',
          name: savedTerm.name,
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.planned,
        }),
      )
      expect(missingYear).toStrictEqual(
        AppResult.failed(
          new NotFoundException('academic year with ID not-found is not found'),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: TermDBEntity

    beforeEach(async () => {
      toBeDeleted = await dataSource.manager.save(
        new TermDBEntity({
          academicYearId: yearDb.id,
          name: '2026/2027 Odd',
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          status: TermStatus.planned,
          createdBy: userDb.id,
        }),
      )
    })

    it('should soft remove correct term', async () => {
      const result = await termRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(TermDBEntity, {
        id: toBeDeleted.id,
      })
      expect(activeRow).toBeNull()

      const deletedRow = await dataSource.manager.findOne(TermDBEntity, {
        where: { id: toBeDeleted.id },
        withDeleted: true,
      })
      expect(deletedRow?.deletedAt).not.toBeNull()
    })

    it('should return success when deleting non-existing term', async () => {
      const result = await termRepository.deleteById('not-found')

      expect(result).toStrictEqual(AppResult.success(null))
    })
  })
})
