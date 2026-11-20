import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { NoParamPromiseUseCase } from '../../common/base-use-case.js'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'

/**
 * Use case to get all faculties
 */
@Injectable()
export class GetFacultiesUseCase implements NoParamPromiseUseCase<Faculty[]> {
  constructor(private readonly facultyRepository: FacultyRepository) {
    this.logger = new Logger('GetFacultiesUseCase')
  }

  private readonly logger: Logger

  execute(): Promise<AppResult<Faculty[]>> {
    this.logger.debug('delegating get all faculties to FacultyRepository')
    return this.facultyRepository.getAll()
  }
}
