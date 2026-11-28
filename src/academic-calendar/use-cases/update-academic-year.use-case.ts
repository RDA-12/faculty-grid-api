import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'

/**
 * Params for UpdateAcademicYearUseCase
 */
export class UpdateAcademicYearParams {
  constructor({
    id,
    name,
    startDate,
    endDate,
    status,
  }: Required<UpdateAcademicYearParams>) {
    this.id = id
    this.name = name
    this.startDate = startDate
    this.endDate = endDate
    this.status = status
  }

  readonly id: string
  readonly name: string
  readonly startDate: string
  readonly endDate: string
  readonly status: AcademicYearStatus
}

/**
 * Use case to update an existing academic year
 */
@Injectable()
export class UpdateAcademicYearUseCase implements PromiseUseCase<
  UpdateAcademicYearParams,
  AcademicYear
> {
  constructor(private readonly academicYearRepository: AcademicYearRepository) {
    this.logger = new Logger('UpdateAcademicYearUseCase')
  }

  private readonly logger: Logger

  execute(params: UpdateAcademicYearParams): Promise<AppResult<AcademicYear>> {
    this.logger.debug(
      'delegating update academic year to AcademicYearRepository',
      { params },
    )
    return this.academicYearRepository.update(params)
  }
}
