import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, Repository } from 'typeorm'
import { AppResult } from '../../common/app-result.js'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import {
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { GetFacultiesParams } from '../user-cases/get-faculties.use-case.js'
import type { UpdateFacultyParams } from '../user-cases/update-faculty.use-case.js'

/**
 * Repository manage faculty data
 */
@Injectable()
export class FacultyRepository {
  constructor(dataSource: DataSource) {
    this.logger = new Logger('FacultyRepository')
    this.repository = dataSource.getRepository(FacultyDBEntity)
  }

  private readonly logger: Logger
  private readonly repository: Repository<FacultyDBEntity>

  /**
   * Save new faculty with name
   */
  async save(name: string, createdBy: string): Promise<AppResult<Faculty>> {
    try {
      this.logger.debug('start saving new faculty', { name, createdBy })
      const facultyInsertDB = new FacultyDBEntity()
      facultyInsertDB.name = name
      facultyInsertDB.createdBy = createdBy
      const facultyDB = await this.repository.save(facultyInsertDB)
      this.logger.debug('faculty saved', { data: facultyDB })
      return AppResult.success(facultyDB.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        // Postgrest foreign_key_violation code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(`user with ID ${createdBy} is not found`),
          )
        }
      }
      this.logger.error('failed to save faculty', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetFacultiesParams,
  ): Promise<AppResult<PaginatedResult<Faculty>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    this.logger.debug('start getting all faculties', { params })
    let query = this.repository.createQueryBuilder('faculties')
    if (params?.search) {
      query = query.andWhere('faculties.name LIKE :search', {
        search: `%${params.search}%`,
      })
    }
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'faculties.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('faculties obtained', { rows, total })
    const faculties = rows.map((it) => it.toDomain())
    return AppResult.success(
      new PaginatedResult({
        data: faculties,
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }

  async update(params: UpdateFacultyParams): Promise<AppResult<Faculty>> {
    try {
      this.logger.debug('start updating faculty', { params })
      const facultyDb = await this.repository.findOne({
        where: { id: params.id },
      })
      if (!facultyDb) {
        this.logger.debug('faculty not found for update', { id: params.id })
        return AppResult.failed(
          new NotFoundException(`faculty with ID ${params.id} is not found`),
        )
      }
      facultyDb.name = params.name
      const updated = await this.repository.save(facultyDb)
      this.logger.debug('faculty updated', { data: updated })
      return AppResult.success(updated.toDomain())
    } catch (error) {
      this.logger.error('failed to update faculty', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get faculty with its programs', { id })
    const facultyDb = await this.repository.findOne({
      where: { id: id },
      relations: {
        programs: true,
      },
    })
    if (!facultyDb) {
      this.logger.debug('faculty not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting faculty')
    await this.repository.softRemove(facultyDb)
    this.logger.debug('faculty deleted')
    return AppResult.success(null)
  }
}
