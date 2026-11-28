import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import { FunctionalRankDBEntity } from '../../common/database/entities/functional-rank.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { FunctionalRank } from '../entities/functional-rank.entity.js'
import {
  AlreadyExistsException,
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateFunctionalRankParams } from '../use-cases/create-functional-rank.use-case.js'
import type { GetFunctionalRanksParams } from '../use-cases/get-functional-ranks.use-case.js'
import type { UpdateFunctionalRankParams } from '../use-cases/update-functional-rank.use-case.js'

/**
 * Repository to manage functional rank data
 */
@Injectable()
export class FunctionalRankRepository {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(FunctionalRankDBEntity)
    this.logger = new Logger('FunctionalRankRepository')
  }

  private readonly repository: Repository<FunctionalRankDBEntity>
  private readonly logger: Logger

  async save(
    params: CreateFunctionalRankParams,
  ): Promise<AppResult<FunctionalRank>> {
    try {
      this.logger.debug('start saving new functional rank', { params })
      const functionalRankDb = await this.repository.save(
        FunctionalRankDBEntity.fromParams(params),
      )
      this.logger.debug('functional rank saved', { data: functionalRankDb })
      return AppResult.success(functionalRankDb.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          return AppResult.failed(
            new AlreadyExistsException(
              `functional rank with name ${params.name} already exists`,
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
      this.logger.error('failed to save functional rank', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetFunctionalRanksParams,
  ): Promise<AppResult<PaginatedResult<FunctionalRank>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('functional_ranks')
    if (params?.search) {
      this.logger.debug('filter functional ranks by name')
      query.andWhere('functional_ranks.name LIKE :search', {
        search: `%${params.search}%`,
      })
    }
    this.logger.debug('start getting all functional ranks', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'functional_ranks.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('functional ranks obtained', { rows, total })
    const functionalRanks = rows.map((it) => it.toDomain())
    return AppResult.success(
      new PaginatedResult({
        data: functionalRanks,
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }

  async getById(id: string): Promise<AppResult<FunctionalRank>> {
    this.logger.debug('start getting functional rank by id', { id })
    const functionalRankDb = await this.repository.findOne({
      where: { id },
    })
    if (!functionalRankDb) {
      this.logger.debug('functional rank not found', { id })
      return AppResult.failed(
        new NotFoundException(`functional rank with ID ${id} is not found`),
      )
    }
    this.logger.debug('functional rank obtained', { data: functionalRankDb })
    return AppResult.success(functionalRankDb.toDomain())
  }

  async update(
    params: UpdateFunctionalRankParams,
  ): Promise<AppResult<FunctionalRank>> {
    try {
      this.logger.debug('start updating functional rank', { params })
      const functionalRankDb = await this.repository.findOne({
        where: { id: params.id },
      })
      if (!functionalRankDb) {
        this.logger.debug('functional rank not found for update', {
          id: params.id,
        })
        return AppResult.failed(
          new NotFoundException(
            `functional rank with ID ${params.id} is not found`,
          ),
        )
      }
      functionalRankDb.name = params.name
      const updated = await this.repository.save(functionalRankDb)
      this.logger.debug('functional rank updated', { data: updated })
      return AppResult.success(updated.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          return AppResult.failed(
            new AlreadyExistsException(
              `functional rank with name ${params.name} already exists`,
            ),
          )
        }
      }
      this.logger.error('failed to update functional rank', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get functional rank', { id })
    const functionalRankDb = await this.repository.findOne({
      where: { id },
    })
    if (!functionalRankDb) {
      this.logger.debug('functional rank not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting functional rank')
    await this.repository.softRemove(functionalRankDb)
    this.logger.debug('functional rank deleted')
    return AppResult.success(null)
  }
}
