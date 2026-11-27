import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { TitleDBEntity } from '../../common/database/entities/title.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { TitleRepository } from './title.repository.js'
import { Title, TitleScope } from '../entities/title.entity.js'
import { CreateTitleParams } from '../user-cases/create-title.use-case.js'
import { GetTitlesParams } from '../user-cases/get-titles.use-case.js'
import { UpdateTitleParams } from '../user-cases/update-title.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { NotFoundException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('TitleRepository', () => {
  let params: CreateTitleParams
  let userDb: UserDBEntity
  let dataSource: DataSource
  let titleRepository: TitleRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        TitleRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'name'
    insertUserDb.email = 'email'
    userDb = await dataSource.manager.save(insertUserDb)

    titleRepository = moduleRef.get(TitleRepository)
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
      params = new CreateTitleParams({
        name: 'Dean',
        scope: TitleScope.faculty,
        createdBy: userDb.id,
      })
    })

    it('should return and save correct title', async () => {
      const result = await titleRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: params.name,
        scope: params.scope,
      })

      const row = await dataSource.manager.findOneBy(TitleDBEntity, {
        id: result.data!.id,
      })
      expect(row?.name).toBe(params.name)
      expect(row?.scope).toBe(params.scope)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should return failed with NotFoundException when user is not found', async () => {
      const result = await titleRepository.save(
        new CreateTitleParams({
          name: params.name,
          scope: params.scope,
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
    let expected: Title[] = []

    beforeEach(async () => {
      const newData: Title[] = []
      for (let i = 0; i < 5; i++) {
        const titleInsertDb = new TitleDBEntity()
        titleInsertDb.name = `title ${i}`
        titleInsertDb.scope =
          i % 2 === 0 ? TitleScope.faculty : TitleScope.program
        titleInsertDb.createdBy = userDb.id
        titleInsertDb.createdAt = new Date(2026, 11, 1 + i)
        const titleDb = await dataSource.manager.save(titleInsertDb)
        newData.unshift(titleDb.toDomain())
      }
      expected = newData
    })

    it('should return correct titles', async () => {
      const result = await titleRepository.getAll()

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

    it('should return correct paginated titles', async () => {
      const result = await titleRepository.getAll(
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

    it('should return correct filtered titles by scope', async () => {
      const result = await titleRepository.getAll(
        new GetTitlesParams({ scope: TitleScope.program }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected.filter((it) => it.scope === TitleScope.program),
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 2,
            }),
          }),
        ),
      )
    })

    it('should return correct filtered titles by search', async () => {
      const result = await titleRepository.getAll(
        new GetTitlesParams({ search: '0' }),
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
    let savedTitle: TitleDBEntity

    beforeEach(async () => {
      savedTitle = await dataSource.manager.save(
        new TitleDBEntity({
          name: 'Dean',
          scope: TitleScope.faculty,
          createdBy: userDb.id,
        }),
      )
    })

    it('should return title when found', async () => {
      const result = await titleRepository.getById(savedTitle.id)

      expect(result).toStrictEqual(AppResult.success(savedTitle.toDomain()))
    })

    it('should return NotFoundException when title is not found', async () => {
      const result = await titleRepository.getById('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('title with ID not-found is not found'),
        ),
      )
    })
  })

  describe('update', () => {
    let savedTitle: TitleDBEntity

    beforeEach(async () => {
      savedTitle = await dataSource.manager.save(
        new TitleDBEntity({
          name: 'Dean',
          scope: TitleScope.faculty,
          createdBy: userDb.id,
        }),
      )
    })

    it('should update and return updated title', async () => {
      const result = await titleRepository.update(
        new UpdateTitleParams({
          id: savedTitle.id,
          name: 'Head of Program',
          scope: TitleScope.program,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new Title({
            id: savedTitle.id,
            name: 'Head of Program',
            scope: TitleScope.program,
          }),
        ),
      )

      const row = await dataSource.manager.findOneBy(TitleDBEntity, {
        id: savedTitle.id,
      })
      expect(row?.name).toBe('Head of Program')
      expect(row?.scope).toBe(TitleScope.program)
    })

    it('should return NotFoundException when title is not found', async () => {
      const result = await titleRepository.update(
        new UpdateTitleParams({
          id: 'not-found',
          name: 'Head of Program',
          scope: TitleScope.program,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('title with ID not-found is not found'),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: TitleDBEntity

    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        const titleDb = await dataSource.manager.save(
          new TitleDBEntity({
            name: `title ${i}`,
            scope: TitleScope.faculty,
            createdBy: userDb.id,
          }),
        )
        if (i === 0) {
          toBeDeleted = titleDb
        }
      }
    })

    it('should soft remove correct title', async () => {
      const result = await titleRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(TitleDBEntity, {
        id: toBeDeleted.id,
      })
      expect(activeRow).toBeNull()

      const rows = await dataSource.manager.find(TitleDBEntity, {
        withDeleted: true,
      })
      expect(rows.map((it) => it.id).includes(toBeDeleted.id)).toBeTruthy()
    })

    it('should return success when deleting non-existing title', async () => {
      const result = await titleRepository.deleteById('not-found')

      expect(result).toStrictEqual(AppResult.success(null))
    })
  })
})
