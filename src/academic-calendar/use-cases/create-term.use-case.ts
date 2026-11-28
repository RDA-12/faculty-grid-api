import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import { TermStatus, type Term } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'
import { GetAcademicYearByIdUseCase } from './get-academic-year-by-id.use-case.js'
import { validateTermAgainstAcademicYear } from './term-validation.helper.js'

type CreateTermParamsArgs = {
  academicYearId: string
  name: string
  startDate: string
  endDate: string
  status?: TermStatus
  createdBy: string
}

/**
 * Params for CreateTermUseCase
 */
export class CreateTermParams {
  constructor({
    academicYearId,
    name,
    startDate,
    endDate,
    status = TermStatus.planned,
    createdBy,
  }: CreateTermParamsArgs) {
    this.academicYearId = academicYearId
    this.name = name
    this.startDate = startDate
    this.endDate = endDate
    this.status = status
    this.createdBy = createdBy
  }

  readonly academicYearId: string
  readonly name: string
  readonly startDate: string
  readonly endDate: string
  readonly status: TermStatus
  readonly createdBy: string
}

/**
 * Use case to create a new term
 */
@Injectable()
export class CreateTermUseCase implements PromiseUseCase<
  CreateTermParams,
  Term
> {
  constructor(
    private readonly termRepository: TermRepository,
    private readonly getAcademicYearByIdUseCase: GetAcademicYearByIdUseCase,
  ) {
    this.logger = new Logger('CreateTermUseCase')
  }

  private readonly logger: Logger

  async execute(params: CreateTermParams): Promise<AppResult<Term>> {
    this.logger.debug('validating term against academic year', { params })
    const validation = await validateTermAgainstAcademicYear(
      params,
      this.getAcademicYearByIdUseCase,
    )
    if (validation.exception) {
      return AppResult.failed(validation.exception)
    }

    this.logger.debug('delegating save new term to TermRepository', { params })
    return this.termRepository.save(params)
  }
}
