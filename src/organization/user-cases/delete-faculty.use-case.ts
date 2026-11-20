import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'

/**
 * Use case to delete a Faculty
 */
@Injectable()
export class DeleteFacultyUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly facultyRepository: FacultyRepository) {
    this.logger = new Logger('DeleteFacultyUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug('delegating deleting a faculty to FacultyRepository')
    return this.facultyRepository.deleteById(params)
  }
}
