import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { TermRepository } from '../repositories/term.repository.js'

/**
 * Use case to delete a term
 */
@Injectable()
export class DeleteTermUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly termRepository: TermRepository) {
    this.logger = new Logger('DeleteTermUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug('delegating deleting term to TermRepository', {
      params,
    })
    return this.termRepository.deleteById(params)
  }
}
