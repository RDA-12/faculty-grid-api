import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import { RankDBEntity } from '../../common/database/entities/rank.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { Rank } from '../entities/rank.entity.js'
import {
  AlreadyExistsException,
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateRankParams } from '../use-cases/create-rank.use-case.js'
import type { GetRanksParams } from '../use-cases/get-ranks.use-case.js'
import type { UpdateRankParams } from '../use-cases/update-rank.use-case.js'

/**
 * Repository to manage rank data
 */
@Injectable()
export class RankRepository {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RankDBEntity)
    this.logger = new Logger('RankRepository')
  }

  private readonly repository: Repository<RankDBEntity>
  private readonly logger: Logger

  async save(params: CreateRankParams): Promise<AppResult<Rank>> {
    try {
      this.logger.debug('start saving new rank', { params })
      const rankDb = await this.repository.save(RankDBEntity.fromParams(params))
      this.logger.debug('rank saved', { data: rankDb })
      return AppResult.success(rankDb.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          return AppResult.failed(
            new AlreadyExistsException(
              `rank with name ${params.name} and type ${params.type} already exists`,
            ),
          )
        }
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `user with ID ${params.createdBy} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to save rank', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetRanksParams,
  ): Promise<AppResult<PaginatedResult<Rank>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('ranks')
    if (params?.type) {
      this.logger.debug('filter ranks by type')
      query.andWhere('ranks.type = :type', {
        type: params.type,
      })
    }
    if (params?.search) {
      this.logger.debug('filter ranks by name')
      query.andWhere('ranks.name LIKE :search', {
        search: `%${params.search}%`,
      })
    }
    this.logger.debug('start getting all ranks', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'ranks.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('ranks obtained', { rows, total })
    const ranks = rows.map((it) => it.toDomain())
    return AppResult.success(
      new PaginatedResult({
        data: ranks,
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }

  async getById(id: string): Promise<AppResult<Rank>> {
    this.logger.debug('start getting rank by id', { id })
    const rankDb = await this.repository.findOne({
      where: { id },
    })
    if (!rankDb) {
      this.logger.debug('rank not found', { id })
      return AppResult.failed(
        new NotFoundException(`rank with ID ${id} is not found`),
      )
    }
    this.logger.debug('rank obtained', { data: rankDb })
    return AppResult.success(rankDb.toDomain())
  }

  async update(params: UpdateRankParams): Promise<AppResult<Rank>> {
    try {
      this.logger.debug('start updating rank', { params })
      const rankDb = await this.repository.findOne({
        where: { id: params.id },
      })
      if (!rankDb) {
        this.logger.debug('rank not found for update', { id: params.id })
        return AppResult.failed(
          new NotFoundException(`rank with ID ${params.id} is not found`),
        )
      }
      rankDb.name = params.name
      rankDb.type = params.type
      const updated = await this.repository.save(rankDb)
      this.logger.debug('rank updated', { data: updated })
      return AppResult.success(updated.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          return AppResult.failed(
            new AlreadyExistsException(
              `rank with name ${params.name} and type ${params.type} already exists`,
            ),
          )
        }
      }
      this.logger.error('failed to update rank', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get rank', { id })
    const rankDb = await this.repository.findOne({
      where: { id },
    })
    if (!rankDb) {
      this.logger.debug('rank not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting rank')
    await this.repository.softRemove(rankDb)
    this.logger.debug('rank deleted')
    return AppResult.success(null)
  }
}
