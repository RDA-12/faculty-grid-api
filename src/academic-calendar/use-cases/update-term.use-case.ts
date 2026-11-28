import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import type { Term, TermStatus } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'
import { GetAcademicYearByIdUseCase } from './get-academic-year-by-id.use-case.js'
import { validateTermAgainstAcademicYear } from './term-validation.helper.js'

/**
 * Params for UpdateTermUseCase
 */
export class UpdateTermParams {
  constructor({
    id,
    academicYearId,
    name,
    startDate,
    endDate,
    status,
  }: Required<UpdateTermParams>) {
    this.id = id
    this.academicYearId = academicYearId
    this.name = name
    this.startDate = startDate
    this.endDate = endDate
    this.status = status
  }

  readonly id: string
  readonly academicYearId: string
  readonly name: string
  readonly startDate: string
  readonly endDate: string
  readonly status: TermStatus
}

/**
 * Use case to update an existing term
 */
@Injectable()
export class UpdateTermUseCase implements PromiseUseCase<
  UpdateTermParams,
  Term
> {
  constructor(
    private readonly termRepository: TermRepository,
    private readonly getAcademicYearByIdUseCase: GetAcademicYearByIdUseCase,
  ) {
    this.logger = new Logger('UpdateTermUseCase')
  }

  private readonly logger: Logger

  async execute(params: UpdateTermParams): Promise<AppResult<Term>> {
    this.logger.debug('validating term against academic year', { params })
    const validation = await validateTermAgainstAcademicYear(
      params,
      this.getAcademicYearByIdUseCase,
    )
    if (validation.exception) {
      return AppResult.failed(validation.exception)
    }

    this.logger.debug('delegating update term to TermRepository', { params })
    return this.termRepository.update(params)
  }
}
