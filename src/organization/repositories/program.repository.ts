import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, Repository } from 'typeorm'
import { ProgramDBEntity } from '../../common/database/entities/program.entity.js'
import { CreateProgramParams } from '../user-cases/create-program.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { Program } from '../entities/program.entity.js'
import {
  UnexpectedException,
  NotFoundException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import { GetProgramsParams } from '../user-cases/get-programs.use-case.js'

/**
 * Repository to manage program data
 */
@Injectable()
export class ProgramRepository {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ProgramDBEntity)
    this.logger = new Logger('ProgramRepository')
  }

  private readonly repository: Repository<ProgramDBEntity>
  private readonly logger: Logger

  async save(params: CreateProgramParams): Promise<AppResult<Program>> {
    try {
      this.logger.debug('start saving new program')
      const programDb = await this.repository.save(
        ProgramDBEntity.fromParams(params),
      )
      this.logger.debug('program saved')
      return AppResult.success(programDb.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        // Postgrest foreign_key_violation code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `faculty with ID ${params.facultyId} or user with ID ${params.createdBy} is not found`,
            ),
          )
        }
      }
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetProgramsParams,
  ): Promise<AppResult<PaginatedResult<Program>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('programs')
    if (params?.facultyId) {
      this.logger.debug('filter programs by facultyId')
      query.where('programs.faculty_id = :facultyId', {
        facultyId: params.facultyId,
      })
    }
    this.logger.debug('start getting all programs')
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'programs.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('programs obtained')
    const programs = rows.map((it) => it.toDomain())
    return AppResult.success(
      new PaginatedResult({
        data: programs,
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }
}
