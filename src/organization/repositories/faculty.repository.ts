import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, Repository } from 'typeorm'
import { AppResult } from '../../common/app-result.js'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import {
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'

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
}
