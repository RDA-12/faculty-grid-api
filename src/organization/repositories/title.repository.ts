import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, Repository } from 'typeorm'
import { TitleDBEntity } from '../../common/database/entities/title.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { Title } from '../entities/title.entity.js'
import {
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateTitleParams } from '../user-cases/create-title.use-case.js'
import type { GetTitlesParams } from '../user-cases/get-titles.use-case.js'
import type { UpdateTitleParams } from '../user-cases/update-title.use-case.js'

/**
 * Repository to manage structural title data
 */
@Injectable()
export class TitleRepository {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TitleDBEntity)
    this.logger = new Logger('TitleRepository')
  }

  private readonly repository: Repository<TitleDBEntity>
  private readonly logger: Logger

  async save(params: CreateTitleParams): Promise<AppResult<Title>> {
    try {
      this.logger.debug('start saving new title', { params })
      const titleDb = await this.repository.save(
        TitleDBEntity.fromParams(params),
      )
      this.logger.debug('title saved', { data: titleDb })
      return AppResult.success(titleDb.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        // Postgres foreign_key_violation code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `user with ID ${params.createdBy} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to save title', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetTitlesParams,
  ): Promise<AppResult<PaginatedResult<Title>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('titles')
    if (params?.scope) {
      this.logger.debug('filter titles by scope')
      query.andWhere('titles.scope = :scope', {
        scope: params.scope,
      })
    }
    if (params?.search) {
      this.logger.debug('filter titles by name')
      query.andWhere('titles.name LIKE :search', {
        search: `%${params.search}%`,
      })
    }
    this.logger.debug('start getting all titles', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'titles.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('titles obtained', { rows, total })
    const titles = rows.map((it) => it.toDomain())
    return AppResult.success(
      new PaginatedResult({
        data: titles,
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }

  async getById(id: string): Promise<AppResult<Title>> {
    this.logger.debug('start getting title by id', { id })
    const titleDb = await this.repository.findOne({
      where: { id },
    })
    if (!titleDb) {
      this.logger.debug('title not found', { id })
      return AppResult.failed(
        new NotFoundException(`title with ID ${id} is not found`),
      )
    }
    this.logger.debug('title obtained', { data: titleDb })
    return AppResult.success(titleDb.toDomain())
  }

  async update(params: UpdateTitleParams): Promise<AppResult<Title>> {
    try {
      this.logger.debug('start updating title', { params })
      const titleDb = await this.repository.findOne({
        where: { id: params.id },
      })
      if (!titleDb) {
        this.logger.debug('title not found for update', { id: params.id })
        return AppResult.failed(
          new NotFoundException(`title with ID ${params.id} is not found`),
        )
      }
      titleDb.name = params.name
      titleDb.scope = params.scope
      const updated = await this.repository.save(titleDb)
      this.logger.debug('title updated', { data: updated })
      return AppResult.success(updated.toDomain())
    } catch (error) {
      this.logger.error('failed to update title', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get title', { id })
    const titleDb = await this.repository.findOne({
      where: { id },
    })
    if (!titleDb) {
      this.logger.debug('title not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting title')
    await this.repository.softRemove(titleDb)
    this.logger.debug('title deleted')
    return AppResult.success(null)
  }
}
