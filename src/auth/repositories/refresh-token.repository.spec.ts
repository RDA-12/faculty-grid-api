import { Test } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { RefreshTokenRepository } from './refresh-token.repository.js'
import {
  AuthenticationStorage,
  RefreshTokenRecord,
} from '@nestjs/authentication'
import { RefreshTokenDBEntity } from '../../common/database/entities/refresh-token.entity.js'

describe('RefreshTokenRepository', () => {
  let dataSource: DataSource
  let refreshTokenRepository: RefreshTokenRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        {
          provide: AuthenticationStorage,
          useValue: {
            registerSource: vi.fn(),
          },
        },
        RefreshTokenRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)

    refreshTokenRepository = moduleRef.get(RefreshTokenRepository)
  })

  beforeEach(async () => {
    for (const entity of dataSource.entityMetadatas) {
      await dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      )
    }
  })

  describe('getRefreshToken', () => {
    let expected: RefreshTokenRecord

    beforeEach(async () => {
      const insertDb = new RefreshTokenDBEntity()
      insertDb.id = 'id'
      insertDb.familyId = 'familyId'
      insertDb.userId = 'userId'
      insertDb.createdAt = new Date()
      insertDb.expiresAt = new Date()
      insertDb.familyExpiresAt = new Date()
      insertDb.usedAt = new Date()
      insertDb.claims = { id: 'id' }
      const dbData = await dataSource.manager.save(insertDb)
      expected = {
        id: dbData.id,
        familyId: dbData.familyId,
        userId: dbData.userId,
        createdAt: dbData.createdAt,
        expiresAt: dbData.expiresAt,
        familyExpiresAt: dbData.familyExpiresAt,
        usedAt: dbData.usedAt ?? undefined,
        claims: dbData.claims ?? undefined,
      }
    })

    it('should return correct refresh token', async () => {
      const result = await refreshTokenRepository.getRefreshToken(expected.id)

      expect(result).toStrictEqual(expected)
    })

    it('should return undefined when refresh token not found', async () => {
      const result = await refreshTokenRepository.getRefreshToken('not-found')

      expect(result).toBeUndefined()
    })
  })
})
