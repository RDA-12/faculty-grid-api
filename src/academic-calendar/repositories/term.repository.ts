import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import { TermDBEntity } from '../../common/database/entities/term.entity.js'
import { formatDateOnly } from '../../common/database/entities/common.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { Term } from '../entities/term.entity.js'
import {
  AlreadyExistsException,
  ConflictException,
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateTermParams } from '../use-cases/create-term.use-case.js'
import type { GetTermsParams } from '../use-cases/get-terms.use-case.js'
import type { UpdateTermParams } from '../use-cases/update-term.use-case.js'

/**
 * Repository to manage term data
 */
@Injectable()
export class TermRepository {
  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TermDBEntity)
    this.logger = new Logger('TermRepository')
  }

  private readonly repository: Repository<TermDBEntity>
  private readonly logger: Logger

  private findOverlapping(
    repo: Repository<TermDBEntity>,
    academicYearId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<TermDBEntity | null> {
    const query = repo
      .createQueryBuilder('terms')
      .where('terms.academic_year_id = :academicYearId', { academicYearId })
      .andWhere('terms.start_date <= :endDate', { endDate })
      .andWhere('terms.end_date >= :startDate', { startDate })

    if (excludeId) {
      query.andWhere('terms.id != :excludeId', { excludeId })
    }

    return query.getOne()
  }

  async save(params: CreateTermParams): Promise<AppResult<Term>> {
    try {
      this.logger.debug('start saving new term', { params })
      const result = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(TermDBEntity)
        const overlapping = await this.findOverlapping(
          repo,
          params.academicYearId,
          params.startDate,
          params.endDate,
        )
        if (overlapping) {
          return AppResult.failed<Term>(
            new ConflictException(
              `term date range overlaps with existing term ${overlapping.name} (${formatDateOnly(overlapping.startDate)} to ${formatDateOnly(overlapping.endDate)})`,
            ),
          )
        }

        const saved = await repo.save(TermDBEntity.fromParams(params))
        return AppResult.success(saved.toDomain())
      })
      this.logger.debug('term save finished', { result })
      return result
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          const constraint = error.driverError?.constraint as string | undefined
          if (constraint === 'UQ_terms_single_active') {
            return AppResult.failed(
              new ConflictException('an active term already exists'),
            )
          }
          return AppResult.failed(
            new AlreadyExistsException(
              `term with name ${params.name} already exists in academic year ${params.academicYearId}`,
            ),
          )
        }
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `academic year with ID ${params.academicYearId} or user with ID ${params.createdBy} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to save term', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetTermsParams,
  ): Promise<AppResult<PaginatedResult<Term>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('terms')
    if (params?.academicYearId) {
      this.logger.debug('filter terms by academicYearId')
      query.andWhere('terms.academic_year_id = :academicYearId', {
        academicYearId: params.academicYearId,
      })
    }
    if (params?.status) {
      this.logger.debug('filter terms by status')
      query.andWhere('terms.status = :status', {
        status: params.status,
      })
    }
    if (params?.search) {
      this.logger.debug('filter terms by name')
      query.andWhere('terms.name LIKE :search', {
        search: `%${params.search}%`,
      })
    }
    this.logger.debug('start getting all terms', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'terms.start_date': 'DESC',
        'terms.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('terms obtained', { rows, total })
    return AppResult.success(
      new PaginatedResult({
        data: rows.map((it) => it.toDomain()),
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }

  async getById(id: string): Promise<AppResult<Term>> {
    this.logger.debug('start getting term by id', { id })
    const termDb = await this.repository.findOne({
      where: { id },
    })
    if (!termDb) {
      this.logger.debug('term not found', { id })
      return AppResult.failed(
        new NotFoundException(`term with ID ${id} is not found`),
      )
    }
    this.logger.debug('term obtained', { data: termDb })
    return AppResult.success(termDb.toDomain())
  }

  async update(params: UpdateTermParams): Promise<AppResult<Term>> {
    try {
      this.logger.debug('start updating term', { params })
      const result = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(TermDBEntity)
        const existing = await repo.findOne({
          where: { id: params.id },
        })
        if (!existing) {
          return AppResult.failed<Term>(
            new NotFoundException(`term with ID ${params.id} is not found`),
          )
        }

        const overlapping = await this.findOverlapping(
          repo,
          params.academicYearId,
          params.startDate,
          params.endDate,
          params.id,
        )
        if (overlapping) {
          return AppResult.failed<Term>(
            new ConflictException(
              `term date range overlaps with existing term ${overlapping.name} (${formatDateOnly(overlapping.startDate)} to ${formatDateOnly(overlapping.endDate)})`,
            ),
          )
        }

        existing.academicYearId = params.academicYearId
        existing.name = params.name
        existing.startDate = params.startDate
        existing.endDate = params.endDate
        existing.status = params.status
        const updated = await repo.save(existing)
        return AppResult.success(updated.toDomain())
      })
      this.logger.debug('term update finished', { result })
      return result
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          const constraint = error.driverError?.constraint as string | undefined
          if (constraint === 'UQ_terms_single_active') {
            return AppResult.failed(
              new ConflictException('an active term already exists'),
            )
          }
          return AppResult.failed(
            new AlreadyExistsException(
              `term with name ${params.name} already exists in academic year ${params.academicYearId}`,
            ),
          )
        }
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `academic year with ID ${params.academicYearId} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to update term', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get term', { id })
    const termDb = await this.repository.findOne({
      where: { id },
    })
    if (!termDb) {
      this.logger.debug('term not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting term')
    await this.repository.softRemove(termDb)
    this.logger.debug('term deleted')
    return AppResult.success(null)
  }
}
