import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { RankDBEntity } from '../../common/database/entities/rank.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { RankRepository } from './rank.repository.js'
import { Rank, RankType } from '../entities/rank.entity.js'
import { CreateRankParams } from '../use-cases/create-rank.use-case.js'
import { GetRanksParams } from '../use-cases/get-ranks.use-case.js'
import { UpdateRankParams } from '../use-cases/update-rank.use-case.js'
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

describe('RankRepository', () => {
  let params: CreateRankParams
  let userDb: UserDBEntity
  let dataSource: DataSource
  let rankRepository: RankRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        RankRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'name'
    insertUserDb.email = 'email'
    userDb = await dataSource.manager.save(insertUserDb)

    rankRepository = moduleRef.get(RankRepository)
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
      params = new CreateRankParams({
        name: 'Penata Muda (III/a)',
        type: RankType.asn,
        createdBy: userDb.id,
      })
    })

    it('should return and save correct rank', async () => {
      const result = await rankRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: params.name,
        type: params.type,
      })

      const row = await dataSource.manager.findOneBy(RankDBEntity, {
        id: result.data!.id,
      })
      expect(row?.name).toBe(params.name)
      expect(row?.type).toBe(params.type)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should allow same name with different type', async () => {
      await rankRepository.save(params)
      const result = await rankRepository.save(
        new CreateRankParams({
          name: params.name,
          type: RankType.military,
          createdBy: userDb.id,
        }),
      )

      expect(result.data).toMatchObject({
        name: params.name,
        type: RankType.military,
      })
    })

    it('should return AlreadyExistsException when (name, type) already exists', async () => {
      await rankRepository.save(params)
      const result = await rankRepository.save(params)

      expect(result).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `rank with name ${params.name} and type ${params.type} already exists`,
          ),
        ),
      )
    })

    it('should allow re-creating (name, type) after soft delete', async () => {
      const first = await rankRepository.save(params)
      await rankRepository.deleteById(first.data!.id)

      const second = await rankRepository.save(params)

      expect(second.exception).toBeNull()
      expect(second.data).toMatchObject({
        name: params.name,
        type: params.type,
      })
    })

    it('should return failed with NotFoundException when user is not found', async () => {
      const result = await rankRepository.save(
        new CreateRankParams({
          name: params.name,
          type: params.type,
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
    let expected: Rank[] = []

    beforeEach(async () => {
      const newData: Rank[] = []
      for (let i = 0; i < 5; i++) {
        const rankInsertDb = new RankDBEntity()
        rankInsertDb.name = `Rank ${i}`
        rankInsertDb.type = i % 2 === 0 ? RankType.asn : RankType.military
        rankInsertDb.createdBy = userDb.id
        rankInsertDb.createdAt = new Date(2026, 11, 1 + i)
        const rankDb = await dataSource.manager.save(rankInsertDb)
        newData.unshift(rankDb.toDomain())
      }
      expected = newData
    })

    it('should return correct ranks', async () => {
      const result = await rankRepository.getAll()

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

    it('should return correct paginated ranks', async () => {
      const result = await rankRepository.getAll(
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

    it('should return correct filtered ranks by type', async () => {
      const result = await rankRepository.getAll(
        new GetRanksParams({ type: RankType.military }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected.filter((it) => it.type === RankType.military),
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 2,
            }),
          }),
        ),
      )
    })

    it('should return correct filtered ranks by search matching name', async () => {
      const result = await rankRepository.getAll(
        new GetRanksParams({ search: 'Rank 0' }),
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
    let savedRank: RankDBEntity

    beforeEach(async () => {
      savedRank = await dataSource.manager.save(
        new RankDBEntity({
          name: 'Penata Muda (III/a)',
          type: RankType.asn,
          createdBy: userDb.id,
        }),
      )
    })

    it('should return rank when found', async () => {
      const result = await rankRepository.getById(savedRank.id)

      expect(result).toStrictEqual(AppResult.success(savedRank.toDomain()))
    })

    it('should return NotFoundException when rank is not found', async () => {
      const result = await rankRepository.getById('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('rank with ID not-found is not found'),
        ),
      )
    })
  })

  describe('update', () => {
    let savedRank: RankDBEntity
    let otherRank: RankDBEntity

    beforeEach(async () => {
      savedRank = await dataSource.manager.save(
        new RankDBEntity({
          name: 'Penata Muda (III/a)',
          type: RankType.asn,
          createdBy: userDb.id,
        }),
      )
      otherRank = await dataSource.manager.save(
        new RankDBEntity({
          name: 'Mayor',
          type: RankType.military,
          createdBy: userDb.id,
        }),
      )
    })

    it('should update and return updated rank', async () => {
      const result = await rankRepository.update(
        new UpdateRankParams({
          id: savedRank.id,
          name: 'Kapten',
          type: RankType.military,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new Rank({
            id: savedRank.id,
            name: 'Kapten',
            type: RankType.military,
          }),
        ),
      )

      const row = await dataSource.manager.findOneBy(RankDBEntity, {
        id: savedRank.id,
      })
      expect(row?.name).toBe('Kapten')
      expect(row?.type).toBe(RankType.military)
    })

    it('should allow updating own record with same name and type', async () => {
      const result = await rankRepository.update(
        new UpdateRankParams({
          id: savedRank.id,
          name: savedRank.name,
          type: savedRank.type,
        }),
      )

      expect(result).toStrictEqual(AppResult.success(savedRank.toDomain()))
    })

    it('should return AlreadyExistsException when updating to duplicate (name, type)', async () => {
      const result = await rankRepository.update(
        new UpdateRankParams({
          id: savedRank.id,
          name: otherRank.name,
          type: otherRank.type,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `rank with name ${otherRank.name} and type ${otherRank.type} already exists`,
          ),
        ),
      )
    })

    it('should return NotFoundException when rank is not found', async () => {
      const result = await rankRepository.update(
        new UpdateRankParams({
          id: 'not-found',
          name: 'Penata (III/c)',
          type: RankType.asn,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('rank with ID not-found is not found'),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: RankDBEntity

    beforeEach(async () => {
      toBeDeleted = await dataSource.manager.save(
        new RankDBEntity({
          name: 'Penata Muda (III/a)',
          type: RankType.asn,
          createdBy: userDb.id,
        }),
      )
    })

    it('should soft remove correct rank', async () => {
      const result = await rankRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(RankDBEntity, {
        id: toBeDeleted.id,
      })
      expect(activeRow).toBeNull()

      const rows = await dataSource.manager.find(RankDBEntity, {
        withDeleted: true,
      })
      expect(rows.map((it) => it.id).includes(toBeDeleted.id)).toBeTruthy()
    })

    it('should return success when deleting non-existing rank', async () => {
      const result = await rankRepository.deleteById('not-found')

      expect(result).toStrictEqual(AppResult.success(null))
    })
  })
})
