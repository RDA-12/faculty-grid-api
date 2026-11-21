import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, Repository } from 'typeorm'
import { AppResult } from '../../common/app-result.js'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import {
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

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
      this.logger.debug('start saving new faculty')
      const facultyInsertDB = new FacultyDBEntity()
      facultyInsertDB.name = name
      facultyInsertDB.createdBy = createdBy
      const facultyDB = await this.repository.save(facultyInsertDB)
      this.logger.debug('faculty saved')
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
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    pagination?: Pagination,
  ): Promise<AppResult<PaginatedResult<Faculty>>> {
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 10
    this.logger.debug('start getting all faculties')
    const [rows, total] = await this.repository
      .createQueryBuilder('faculties')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'faculties.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('faculties obtained')
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

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get faculty with its programs')
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
