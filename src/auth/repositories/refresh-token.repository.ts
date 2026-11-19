import {
  AuthenticationStorage,
  RefreshTokenRecord,
  RefreshTokenStore,
} from '@nestjs/authentication'
import { Injectable, Logger } from '@nestjs/common'
import { DataSource, IsNull, Repository } from 'typeorm'
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

  private createDb(record: RefreshTokenRecord) {
    const db = new RefreshTokenDBEntity()
    db.id = record.id
    db.familyId = record.familyId
    db.userId = record.userId
    db.createdAt = record.createdAt
    db.expiresAt = record.expiresAt
    db.familyExpiresAt = record.familyExpiresAt
    db.usedAt = record.usedAt
    db.claims = record.claims
    return db
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    this.logger.debug('start get refresh token by its id')
    const row = await this.repository.findOneBy({ id })
    if (row) {
      this.logger.debug('refresh token found')
      return this.createRecord(row)
    }
    this.logger.debug('refresh token not found')
    return undefined
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    const dbData = this.createDb(record)
    this.logger.debug('start saving new refresh token')
    await this.repository.save(dbData)
    this.logger.debug('refresh token saved')
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    this.logger.debug('start marking refresh token as used')
    const result = await this.repository.update(
      { id: id, usedAt: IsNull() },
      { usedAt: at },
    )
    this.logger.debug('refresh token marked')
    return (result.affected ?? 0) === 1
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    this.logger.debug('start revoke refresh token family')
    await this.repository.update({ familyId: familyId }, { revoked: true })
    this.logger.debug('refresh token family revoked')
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    this.logger.debug('start check refresh token family revoked status')
    const result = await this.repository.findOneBy({
      familyId: familyId,
      revoked: true,
    })
    if (result === null) {
      this.logger.debug('refresh token family not revoked')
      return false
    }
    this.logger.debug('refresh token family revoked')
    return true
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    this.logger.debug('start revoke user refresh token')
    await this.repository.update({ userId: userId }, { revoked: true })
    this.logger.debug('user refresh token revoked')
  }
}
