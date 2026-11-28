import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import type {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetAcademicYearsParams extends Pagination {
  constructor({
    page,
    pageSize,
    status,
    search,
  }: Partial<GetAcademicYearsParams>) {
    super({ page, pageSize })
    this.status = status
    this.search = search
  }

  readonly status?: AcademicYearStatus
  readonly search?: string
}

/**
 * Use case to get academic years
 */
@Injectable()
export class GetAcademicYearsUseCase implements PromiseUseCase<
  GetAcademicYearsParams,
  PaginatedResult<AcademicYear>
> {
  constructor(private readonly academicYearRepository: AcademicYearRepository) {
    this.logger = new Logger('GetAcademicYearsUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetAcademicYearsParams,
  ): Promise<AppResult<PaginatedResult<AcademicYear>>> {
    this.logger.debug(
      'delegating get academic years to AcademicYearRepository',
      { params },
    )
    return this.academicYearRepository.getAll(params)
  }
}
