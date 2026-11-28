import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import { LecturerDBEntity } from '../../common/database/entities/lecturer.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { Lecturer } from '../entities/lecturer.entity.js'
import {
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateLecturerParams } from '../use-cases/create-lecturer.use-case.js'
import type { GetLecturersParams } from '../use-cases/get-lecturers.use-case.js'
import type { UpdateLecturerParams } from '../use-cases/update-lecturer.use-case.js'

/**
 * Repository to manage lecturer data
 */
@Injectable()
export class LecturerRepository {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(LecturerDBEntity)
    this.logger = new Logger('LecturerRepository')
  }

  private readonly repository: Repository<LecturerDBEntity>
  private readonly logger: Logger

  async save(params: CreateLecturerParams): Promise<AppResult<Lecturer>> {
    try {
      this.logger.debug('start saving new lecturer', { params })
      const lecturerDb = await this.repository.save(
        LecturerDBEntity.fromParams(params),
      )
      this.logger.debug('lecturer saved', { data: lecturerDb })
      return AppResult.success(lecturerDb.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `program with ID ${params.programId}, rank with ID ${params.rankId}, functional rank with ID ${params.functionalRankId}, or user with ID ${params.createdBy} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to save lecturer', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetLecturersParams,
  ): Promise<AppResult<PaginatedResult<Lecturer>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('lecturers')
    if (params?.programId) {
      this.logger.debug('filter lecturers by programId')
      query.andWhere('lecturers.program_id = :programId', {
        programId: params.programId,
      })
    }
    if (params?.employmentStatus) {
      this.logger.debug('filter lecturers by employmentStatus')
      query.andWhere('lecturers.employment_status = :employmentStatus', {
        employmentStatus: params.employmentStatus,
      })
    }
    if (params?.rankId) {
      this.logger.debug('filter lecturers by rankId')
      query.andWhere('lecturers.rank_id = :rankId', {
        rankId: params.rankId,
      })
    }
    if (params?.functionalRankId) {
      this.logger.debug('filter lecturers by functionalRankId')
      query.andWhere('lecturers.functional_rank_id = :functionalRankId', {
        functionalRankId: params.functionalRankId,
      })
    }
    if (params?.academicDegree) {
      this.logger.debug('filter lecturers by academicDegree')
      query.andWhere('lecturers.academic_degree = :academicDegree', {
        academicDegree: params.academicDegree,
      })
    }
    if (params?.search) {
      this.logger.debug('filter lecturers by name or displayName')
      query.andWhere(
        '(lecturers.name LIKE :search OR lecturers.display_name LIKE :search)',
        {
          search: `%${params.search}%`,
        },
      )
    }
    this.logger.debug('start getting all lecturers', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'lecturers.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('lecturers obtained', { rows, total })
    const lecturers = rows.map((it) => it.toDomain())
    return AppResult.success(
      new PaginatedResult({
        data: lecturers,
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }

  async getById(id: string): Promise<AppResult<Lecturer>> {
    this.logger.debug('start getting lecturer by id', { id })
    const lecturerDb = await this.repository.findOne({
      where: { id },
    })
    if (!lecturerDb) {
      this.logger.debug('lecturer not found', { id })
      return AppResult.failed(
        new NotFoundException(`lecturer with ID ${id} is not found`),
      )
    }
    this.logger.debug('lecturer obtained', { data: lecturerDb })
    return AppResult.success(lecturerDb.toDomain())
  }

  async update(params: UpdateLecturerParams): Promise<AppResult<Lecturer>> {
    try {
      this.logger.debug('start updating lecturer', { params })
      const lecturerDb = await this.repository.findOne({
        where: { id: params.id },
      })
      if (!lecturerDb) {
        this.logger.debug('lecturer not found for update', { id: params.id })
        return AppResult.failed(
          new NotFoundException(`lecturer with ID ${params.id} is not found`),
        )
      }
      lecturerDb.name = params.name
      lecturerDb.displayName = params.displayName
      lecturerDb.programId = params.programId
      lecturerDb.employmentStatus = params.employmentStatus
      lecturerDb.rankId = params.rankId
      lecturerDb.functionalRankId = params.functionalRankId
      lecturerDb.academicDegree = params.academicDegree
      const updated = await this.repository.save(lecturerDb)
      this.logger.debug('lecturer updated', { data: updated })
      return AppResult.success(updated.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `program with ID ${params.programId}, rank with ID ${params.rankId}, or functional rank with ID ${params.functionalRankId} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to update lecturer', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get lecturer', { id })
    const lecturerDb = await this.repository.findOne({
      where: { id },
    })
    if (!lecturerDb) {
      this.logger.debug('lecturer not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting lecturer')
    await this.repository.softRemove(lecturerDb)
    this.logger.debug('lecturer deleted')
    return AppResult.success(null)
  }
}
