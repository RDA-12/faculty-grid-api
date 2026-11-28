import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'

/**
 * Use case to delete a functional rank
 */
@Injectable()
export class DeleteFunctionalRankUseCase implements PromiseUseCase<
  string,
  null
> {
  constructor(
    private readonly functionalRankRepository: FunctionalRankRepository,
  ) {
    this.logger = new Logger('DeleteFunctionalRankUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug(
      'delegating deleting functional rank to FunctionalRankRepository',
      { params },
    )
    return this.functionalRankRepository.deleteById(params)
  }
}
