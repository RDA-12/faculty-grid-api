import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'

/**
 * Use case to get a single faculty by ID
 */
@Injectable()
export class GetFacultyByIdUseCase implements PromiseUseCase<string, Faculty> {
  constructor(private readonly facultyRepository: FacultyRepository) {
    this.logger = new Logger('GetFacultyByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<Faculty>> {
    this.logger.debug('delegating get faculty by id to FacultyRepository', {
      params,
    })
    return this.facultyRepository.getById(params)
  }
}
