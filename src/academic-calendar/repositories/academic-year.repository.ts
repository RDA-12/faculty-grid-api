import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import { AcademicYearDBEntity } from '../../common/database/entities/academic-year.entity.js'
import { formatDateOnly } from '../../common/database/entities/common.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { AcademicYear } from '../entities/academic-year.entity.js'
import {
  AlreadyExistsException,
  ConflictException,
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateAcademicYearParams } from '../use-cases/create-academic-year.use-case.js'
import type { GetAcademicYearsParams } from '../use-cases/get-academic-years.use-case.js'
import type { UpdateAcademicYearParams } from '../use-cases/update-academic-year.use-case.js'

/**
 * Repository to manage academic year data
 */
@Injectable()
export class AcademicYearRepository {
  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(AcademicYearDBEntity)
    this.logger = new Logger('AcademicYearRepository')
  }

  private readonly repository: Repository<AcademicYearDBEntity>
  private readonly logger: Logger

  private findOverlapping(
    repo: Repository<AcademicYearDBEntity>,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<AcademicYearDBEntity | null> {
    const query = repo
      .createQueryBuilder('academic_years')
      .where('academic_years.start_date <= :endDate', { endDate })
      .andWhere('academic_years.end_date >= :startDate', { startDate })

    if (excludeId) {
      query.andWhere('academic_years.id != :excludeId', { excludeId })
    }

    return query.getOne()
  }

  async save(
    params: CreateAcademicYearParams,
  ): Promise<AppResult<AcademicYear>> {
    try {
      this.logger.debug('start saving new academic year', { params })
      const result = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(AcademicYearDBEntity)
        const overlapping = await this.findOverlapping(
          repo,
          params.startDate,
          params.endDate,
        )
        if (overlapping) {
          return AppResult.failed<AcademicYear>(
            new ConflictException(
              `academic year date range overlaps with existing academic year ${overlapping.name} (${formatDateOnly(overlapping.startDate)} to ${formatDateOnly(overlapping.endDate)})`,
            ),
          )
        }

        const saved = await repo.save(AcademicYearDBEntity.fromParams(params))
        return AppResult.success(saved.toDomain())
      })
      this.logger.debug('academic year save finished', { result })
      return result
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          const constraint = error.driverError?.constraint as string | undefined
          if (constraint === 'UQ_academic_years_single_active') {
            return AppResult.failed(
              new ConflictException('an active academic year already exists'),
            )
          }
          return AppResult.failed(
            new AlreadyExistsException(
              `academic year with name ${params.name} already exists`,
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
      this.logger.error('failed to save academic year', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetAcademicYearsParams,
  ): Promise<AppResult<PaginatedResult<AcademicYear>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('academic_years')
    if (params?.status) {
      this.logger.debug('filter academic years by status')
      query.andWhere('academic_years.status = :status', {
        status: params.status,
      })
    }
    if (params?.search) {
      this.logger.debug('filter academic years by name')
      query.andWhere('academic_years.name LIKE :search', {
        search: `%${params.search}%`,
      })
    }
    this.logger.debug('start getting all academic years', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'academic_years.start_date': 'DESC',
        'academic_years.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('academic years obtained', { rows, total })
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

  async getById(id: string): Promise<AppResult<AcademicYear>> {
    this.logger.debug('start getting academic year by id', { id })
    const academicYearDb = await this.repository.findOne({
      where: { id },
    })
    if (!academicYearDb) {
      this.logger.debug('academic year not found', { id })
      return AppResult.failed(
        new NotFoundException(`academic year with ID ${id} is not found`),
      )
    }
    this.logger.debug('academic year obtained', { data: academicYearDb })
    return AppResult.success(academicYearDb.toDomain())
  }

  async update(
    params: UpdateAcademicYearParams,
  ): Promise<AppResult<AcademicYear>> {
    try {
      this.logger.debug('start updating academic year', { params })
      const result = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(AcademicYearDBEntity)
        const existing = await repo.findOne({
          where: { id: params.id },
        })
        if (!existing) {
          return AppResult.failed<AcademicYear>(
            new NotFoundException(
              `academic year with ID ${params.id} is not found`,
            ),
          )
        }

        const overlapping = await this.findOverlapping(
          repo,
          params.startDate,
          params.endDate,
          params.id,
        )
        if (overlapping) {
          return AppResult.failed<AcademicYear>(
            new ConflictException(
              `academic year date range overlaps with existing academic year ${overlapping.name} (${formatDateOnly(overlapping.startDate)} to ${formatDateOnly(overlapping.endDate)})`,
            ),
          )
        }

        existing.name = params.name
        existing.startDate = params.startDate
        existing.endDate = params.endDate
        existing.status = params.status
        const updated = await repo.save(existing)
        return AppResult.success(updated.toDomain())
      })
      this.logger.debug('academic year update finished', { result })
      return result
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          const constraint = error.driverError?.constraint as string | undefined
          if (constraint === 'UQ_academic_years_single_active') {
            return AppResult.failed(
              new ConflictException('an active academic year already exists'),
            )
          }
          return AppResult.failed(
            new AlreadyExistsException(
              `academic year with name ${params.name} already exists`,
            ),
          )
        }
      }
      this.logger.error('failed to update academic year', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get academic year', { id })
    const academicYearDb = await this.repository.findOne({
      where: { id },
    })
    if (!academicYearDb) {
      this.logger.debug('academic year not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting academic year')
    await this.repository.softRemove(academicYearDb)
    this.logger.debug('academic year deleted')
    return AppResult.success(null)
  }
}
