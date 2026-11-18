import {
  AuthenticationStorage,
  RefreshTokenRecord,
  RefreshTokenStore,
} from '@nestjs/authentication'
import { Injectable, Logger } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { RefreshTokenDBEntity } from '../../common/database/entities/refresh-token.entity.js'

/** Repository to manage refresh token data */
@Injectable()
export class RefreshTokenRepository implements RefreshTokenStore {
  constructor(dataSource: DataSource, nestAuthStorage: AuthenticationStorage) {
    this.logger = new Logger('RefreshTokenRepository')
    this.repository = dataSource.getRepository(RefreshTokenDBEntity)
    nestAuthStorage.registerSource({
      refreshTokens: this,
    })
  }

  private readonly logger: Logger
  private readonly repository: Repository<RefreshTokenDBEntity>

  private createRecord(
    db: RefreshTokenDBEntity | null,
  ): RefreshTokenRecord | undefined {
    if (!db) return undefined

    return {
      id: db.id,
      familyId: db.familyId,
      userId: db.userId,
      createdAt: db.createdAt,
      expiresAt: db.expiresAt,
      familyExpiresAt: db.familyExpiresAt,
      usedAt: db.usedAt ?? undefined,
      claims: db.claims ?? undefined,
    }
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    this.logger.debug('start get refresh token by its id')
    const row = await this.repository.findOneBy({ id })
    return this.createRecord(row)
  }

  saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    throw new Error('Method not implemented.')
  }

  markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  revokeRefreshTokenFamily(familyId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  revokeUserRefreshTokens(userId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
