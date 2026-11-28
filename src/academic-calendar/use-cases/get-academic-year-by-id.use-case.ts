import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { AcademicYear } from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'

/**
 * Use case to get a single academic year by ID
 */
@Injectable()
export class GetAcademicYearByIdUseCase implements PromiseUseCase<
  string,
  AcademicYear
> {
  constructor(private readonly academicYearRepository: AcademicYearRepository) {
    this.logger = new Logger('GetAcademicYearByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<AcademicYear>> {
    this.logger.debug(
      'delegating get academic year by id to AcademicYearRepository',
      { params },
    )
    return this.academicYearRepository.getById(params)
  }
}
