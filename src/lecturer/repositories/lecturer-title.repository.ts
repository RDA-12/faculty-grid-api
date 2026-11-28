import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import {
  formatDateOnly,
  LecturerTitleDBEntity,
} from '../../common/database/entities/lecturer-title.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { LecturerTitle } from '../entities/lecturer-title.entity.js'
import {
  InvalidRequestError,
  InvalidRequestException,
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateLecturerTitleParams } from '../use-cases/create-lecturer-title.use-case.js'
import type { GetLecturerTitlesParams } from '../use-cases/get-lecturer-titles.use-case.js'
import type { UpdateLecturerTitleParams } from '../use-cases/update-lecturer-title.use-case.js'

type ActiveHolderFilter = {
  titleId: string
  facultyId: string | null
  programId: string | null
  excludeId?: string
}

/**
 * Repository to manage rotatable lecturer structural title assignments
 */
@Injectable()
export class LecturerTitleRepository {
  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(LecturerTitleDBEntity)
    this.logger = new Logger('LecturerTitleRepository')
  }

  private readonly repository: Repository<LecturerTitleDBEntity>
  private readonly logger: Logger

  private findActiveHolder(
    repo: Repository<LecturerTitleDBEntity>,
    { titleId, facultyId, programId, excludeId }: ActiveHolderFilter,
  ): Promise<LecturerTitleDBEntity | null> {
    const query = repo
      .createQueryBuilder('lecturer_titles')
      .where('lecturer_titles.title_id = :titleId', { titleId })
      .andWhere('lecturer_titles.end_date IS NULL')

    if (facultyId) {
      query.andWhere('lecturer_titles.faculty_id = :facultyId', { facultyId })
    } else if (programId) {
      query.andWhere('lecturer_titles.program_id = :programId', { programId })
    }

    if (excludeId) {
      query.andWhere('lecturer_titles.id != :excludeId', { excludeId })
    }

    return query.getOne()
  }

  private async rotateActiveHolderIfNeeded(
    repo: Repository<LecturerTitleDBEntity>,
    params: ActiveHolderFilter & { startDate: string },
  ): Promise<AppResult<null>> {
    const activeHolder = await this.findActiveHolder(repo, params)
    if (!activeHolder) {
      return AppResult.success(null)
    }

    const activeStartDate = formatDateOnly(activeHolder.startDate)
    if (params.startDate < activeStartDate) {
      return AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'startDate',
            value: params.startDate,
            constraints: [
              `startDate must not be earlier than the current active holder startDate (${activeStartDate})`,
            ],
          }),
        ]),
      )
    }

    activeHolder.endDate = params.startDate
    await repo.save(activeHolder)
    return AppResult.success(null)
  }

  async save(
    params: CreateLecturerTitleParams,
  ): Promise<AppResult<LecturerTitle>> {
    try {
      this.logger.debug('start saving new lecturer title', { params })
      const result = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(LecturerTitleDBEntity)

        if (params.endDate === null) {
          const rotation = await this.rotateActiveHolderIfNeeded(repo, {
            titleId: params.titleId,
            facultyId: params.facultyId,
            programId: params.programId,
            startDate: params.startDate,
          })
          if (rotation.exception) {
            return AppResult.failed<LecturerTitle>(rotation.exception)
          }
        }

        const saved = await repo.save(LecturerTitleDBEntity.fromParams(params))
        return AppResult.success(saved.toDomain())
      })
      this.logger.debug('lecturer title save finished', { result })
      return result
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `lecturer with ID ${params.lecturerId}, title with ID ${params.titleId}, faculty with ID ${params.facultyId}, program with ID ${params.programId}, or user with ID ${params.createdBy} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to save lecturer title', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetLecturerTitlesParams,
  ): Promise<AppResult<PaginatedResult<LecturerTitle>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('lecturer_titles')
    if (params?.lecturerId) {
      query.andWhere('lecturer_titles.lecturer_id = :lecturerId', {
        lecturerId: params.lecturerId,
      })
    }
    if (params?.titleId) {
      query.andWhere('lecturer_titles.title_id = :titleId', {
        titleId: params.titleId,
      })
    }
    if (params?.facultyId) {
      query.andWhere('lecturer_titles.faculty_id = :facultyId', {
        facultyId: params.facultyId,
      })
    }
    if (params?.programId) {
      query.andWhere('lecturer_titles.program_id = :programId', {
        programId: params.programId,
      })
    }
    if (params?.activeOnly) {
      query.andWhere('lecturer_titles.end_date IS NULL')
    }
    this.logger.debug('start getting all lecturer titles', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'lecturer_titles.start_date': 'DESC',
        'lecturer_titles.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('lecturer titles obtained', { rows, total })
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

  async getById(id: string): Promise<AppResult<LecturerTitle>> {
    this.logger.debug('start getting lecturer title by id', { id })
    const row = await this.repository.findOne({
      where: { id },
    })
    if (!row) {
      this.logger.debug('lecturer title not found', { id })
      return AppResult.failed(
        new NotFoundException(`lecturer title with ID ${id} is not found`),
      )
    }
    this.logger.debug('lecturer title obtained', { data: row })
    return AppResult.success(row.toDomain())
  }

  async update(
    params: UpdateLecturerTitleParams,
  ): Promise<AppResult<LecturerTitle>> {
    try {
      this.logger.debug('start updating lecturer title', { params })
      const result = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(LecturerTitleDBEntity)
        const existing = await repo.findOne({
          where: { id: params.id },
        })
        if (!existing) {
          return AppResult.failed<LecturerTitle>(
            new NotFoundException(
              `lecturer title with ID ${params.id} is not found`,
            ),
          )
        }

        if (params.endDate === null) {
          const rotation = await this.rotateActiveHolderIfNeeded(repo, {
            titleId: params.titleId,
            facultyId: params.facultyId,
            programId: params.programId,
            startDate: params.startDate,
            excludeId: params.id,
          })
          if (rotation.exception) {
            return AppResult.failed<LecturerTitle>(rotation.exception)
          }
        }

        existing.lecturerId = params.lecturerId
        existing.titleId = params.titleId
        existing.facultyId = params.facultyId
        existing.programId = params.programId
        existing.startDate = params.startDate
        existing.endDate = params.endDate
        const updated = await repo.save(existing)
        return AppResult.success(updated.toDomain())
      })
      this.logger.debug('lecturer title update finished', { result })
      return result
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `lecturer with ID ${params.lecturerId}, title with ID ${params.titleId}, faculty with ID ${params.facultyId}, or program with ID ${params.programId} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to update lecturer title', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get lecturer title', { id })
    const row = await this.repository.findOne({
      where: { id },
    })
    if (!row) {
      this.logger.debug('lecturer title not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting lecturer title')
    await this.repository.softRemove(row)
    this.logger.debug('lecturer title deleted')
    return AppResult.success(null)
  }
}
