import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Term } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'

/**
 * Use case to get a single term by ID
 */
@Injectable()
export class GetTermByIdUseCase implements PromiseUseCase<string, Term> {
  constructor(private readonly termRepository: TermRepository) {
    this.logger = new Logger('GetTermByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<Term>> {
    this.logger.debug('delegating get term by id to TermRepository', {
      params,
    })
    return this.termRepository.getById(params)
  }
}
