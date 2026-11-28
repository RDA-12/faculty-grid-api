import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import {
  AcademicYearStatus,
  type AcademicYear,
} from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'

type CreateAcademicYearParamsArgs = {
  name: string
  startDate: string
  endDate: string
  status?: AcademicYearStatus
  createdBy: string
}

/**
 * Params for CreateAcademicYearUseCase
 */
export class CreateAcademicYearParams {
  constructor({
    name,
    startDate,
    endDate,
    status = AcademicYearStatus.planned,
    createdBy,
  }: CreateAcademicYearParamsArgs) {
    this.name = name
    this.startDate = startDate
    this.endDate = endDate
    this.status = status
    this.createdBy = createdBy
  }

  readonly name: string
  readonly startDate: string
  readonly endDate: string
  readonly status: AcademicYearStatus
  readonly createdBy: string
}

/**
 * Use case to create a new academic year
 */
@Injectable()
export class CreateAcademicYearUseCase implements PromiseUseCase<
  CreateAcademicYearParams,
  AcademicYear
> {
  constructor(private readonly academicYearRepository: AcademicYearRepository) {
    this.logger = new Logger('CreateAcademicYearUseCase')
  }

  private readonly logger: Logger

  execute(params: CreateAcademicYearParams): Promise<AppResult<AcademicYear>> {
    this.logger.debug(
      'delegating save new academic year to AcademicYearRepository',
      { params },
    )
    return this.academicYearRepository.save(params)
  }
}
