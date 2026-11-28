import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { FunctionalRankDBEntity } from '../../common/database/entities/functional-rank.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { FunctionalRankRepository } from './functional-rank.repository.js'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { CreateFunctionalRankParams } from '../use-cases/create-functional-rank.use-case.js'
import { GetFunctionalRanksParams } from '../use-cases/get-functional-ranks.use-case.js'
import { UpdateFunctionalRankParams } from '../use-cases/update-functional-rank.use-case.js'
import { AppResult } from '../../common/app-result.js'
import {
  AlreadyExistsException,
  NotFoundException,
} from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('FunctionalRankRepository', () => {
  let params: CreateFunctionalRankParams
  let userDb: UserDBEntity
  let dataSource: DataSource
  let functionalRankRepository: FunctionalRankRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        FunctionalRankRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'name'
    insertUserDb.email = 'email'
    userDb = await dataSource.manager.save(insertUserDb)

    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
  })

  beforeEach(async () => {
    for (const entity of dataSource.entityMetadatas) {
      if (['users'].includes(entity.tableName)) continue
      await dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      )
    }
  })

  describe('save', () => {
    beforeEach(() => {
      params = new CreateFunctionalRankParams({
        name: 'Lektor',
        createdBy: userDb.id,
      })
    })

    it('should return and save correct functional rank', async () => {
      const result = await functionalRankRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: params.name,
      })

      const row = await dataSource.manager.findOneBy(FunctionalRankDBEntity, {
        id: result.data!.id,
      })
      expect(row?.name).toBe(params.name)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should return AlreadyExistsException when name already exists', async () => {
      await functionalRankRepository.save(params)
      const result = await functionalRankRepository.save(params)

      expect(result).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `functional rank with name ${params.name} already exists`,
          ),
        ),
      )
    })

    it('should allow re-creating name after soft delete', async () => {
      const first = await functionalRankRepository.save(params)
      await functionalRankRepository.deleteById(first.data!.id)

      const second = await functionalRankRepository.save(params)

      expect(second.exception).toBeNull()
      expect(second.data).toMatchObject({
        name: params.name,
      })
    })

    it('should return failed with NotFoundException when user is not found', async () => {
      const result = await functionalRankRepository.save(
        new CreateFunctionalRankParams({
          name: params.name,
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
    let expected: FunctionalRank[] = []

    beforeEach(async () => {
      const newData: FunctionalRank[] = []
      for (let i = 0; i < 5; i++) {
        const functionalRankInsertDb = new FunctionalRankDBEntity()
        functionalRankInsertDb.name = `Functional Rank ${i}`
        functionalRankInsertDb.createdBy = userDb.id
        functionalRankInsertDb.createdAt = new Date(2026, 11, 1 + i)
        const functionalRankDb = await dataSource.manager.save(
          functionalRankInsertDb,
        )
        newData.unshift(functionalRankDb.toDomain())
      }
      expected = newData
    })

    it('should return correct functional ranks', async () => {
      const result = await functionalRankRepository.getAll()

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

    it('should return correct paginated functional ranks', async () => {
      const result = await functionalRankRepository.getAll(
        new Pagination({ page: 2, pageSize: 1 }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: [expected[1]],
            pagination: new PaginationResult({
              page: 2,
              pageSize: 1,
              total: 5,
            }),
          }),
        ),
      )
    })

    it('should return correct filtered functional ranks by search', async () => {
      const result = await functionalRankRepository.getAll(
        new GetFunctionalRanksParams({ search: '0' }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: [expected[4]],
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
    let savedFunctionalRank: FunctionalRankDBEntity

    beforeEach(async () => {
      savedFunctionalRank = await dataSource.manager.save(
        new FunctionalRankDBEntity({
          name: 'Lektor',
          createdBy: userDb.id,
        }),
      )
    })

    it('should return functional rank when found', async () => {
      const result = await functionalRankRepository.getById(
        savedFunctionalRank.id,
      )

      expect(result).toStrictEqual(
        AppResult.success(savedFunctionalRank.toDomain()),
      )
    })

    it('should return NotFoundException when functional rank is not found', async () => {
      const result = await functionalRankRepository.getById('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            'functional rank with ID not-found is not found',
          ),
        ),
      )
    })
  })

  describe('update', () => {
    let savedFunctionalRank: FunctionalRankDBEntity
    let otherFunctionalRank: FunctionalRankDBEntity

    beforeEach(async () => {
      savedFunctionalRank = await dataSource.manager.save(
        new FunctionalRankDBEntity({
          name: 'Lektor',
          createdBy: userDb.id,
        }),
      )
      otherFunctionalRank = await dataSource.manager.save(
        new FunctionalRankDBEntity({
          name: 'Guru Besar',
          createdBy: userDb.id,
        }),
      )
    })

    it('should update and return updated functional rank', async () => {
      const result = await functionalRankRepository.update(
        new UpdateFunctionalRankParams({
          id: savedFunctionalRank.id,
          name: 'Lektor Kepala',
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new FunctionalRank({
            id: savedFunctionalRank.id,
            name: 'Lektor Kepala',
          }),
        ),
      )

      const row = await dataSource.manager.findOneBy(FunctionalRankDBEntity, {
        id: savedFunctionalRank.id,
      })
      expect(row?.name).toBe('Lektor Kepala')
    })

    it('should allow updating own record with same name', async () => {
      const result = await functionalRankRepository.update(
        new UpdateFunctionalRankParams({
          id: savedFunctionalRank.id,
          name: savedFunctionalRank.name,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(savedFunctionalRank.toDomain()),
      )
    })

    it('should return AlreadyExistsException when updating to duplicate name', async () => {
      const result = await functionalRankRepository.update(
        new UpdateFunctionalRankParams({
          id: savedFunctionalRank.id,
          name: otherFunctionalRank.name,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `functional rank with name ${otherFunctionalRank.name} already exists`,
          ),
        ),
      )
    })

    it('should return NotFoundException when functional rank is not found', async () => {
      const result = await functionalRankRepository.update(
        new UpdateFunctionalRankParams({
          id: 'not-found',
          name: 'Lektor Kepala',
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            'functional rank with ID not-found is not found',
          ),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: FunctionalRankDBEntity

    beforeEach(async () => {
      toBeDeleted = await dataSource.manager.save(
        new FunctionalRankDBEntity({
          name: 'Lektor',
          createdBy: userDb.id,
        }),
      )
    })

    it('should soft remove correct functional rank', async () => {
      const result = await functionalRankRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(
        FunctionalRankDBEntity,
        {
          id: toBeDeleted.id,
        },
      )
      expect(activeRow).toBeNull()

      const rows = await dataSource.manager.find(FunctionalRankDBEntity, {
        withDeleted: true,
      })
      expect(rows.map((it) => it.id).includes(toBeDeleted.id)).toBeTruthy()
    })

    it('should return success when deleting non-existing functional rank', async () => {
      const result = await functionalRankRepository.deleteById('not-found')

      expect(result).toStrictEqual(AppResult.success(null))
    })
  })
})
