import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'

/**
 * Use case to delete an academic year
 */
@Injectable()
export class DeleteAcademicYearUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly academicYearRepository: AcademicYearRepository) {
    this.logger = new Logger('DeleteAcademicYearUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug(
      'delegating deleting academic year to AcademicYearRepository',
      { params },
    )
    return this.academicYearRepository.deleteById(params)
  }
}
