import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import type { Term, TermStatus } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetTermsParams extends Pagination {
  constructor({
    page,
    pageSize,
    academicYearId,
    status,
    search,
  }: Partial<GetTermsParams>) {
    super({ page, pageSize })
    this.academicYearId = academicYearId
    this.status = status
    this.search = search
  }

  readonly academicYearId?: string
  readonly status?: TermStatus
  readonly search?: string
}

/**
 * Use case to get terms
 */
@Injectable()
export class GetTermsUseCase implements PromiseUseCase<
  GetTermsParams,
  PaginatedResult<Term>
> {
  constructor(private readonly termRepository: TermRepository) {
    this.logger = new Logger('GetTermsUseCase')
  }

  private readonly logger: Logger

  execute(params?: GetTermsParams): Promise<AppResult<PaginatedResult<Term>>> {
    this.logger.debug('delegating get terms to TermRepository', { params })
    return this.termRepository.getAll(params)
  }
}
