import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'

/**
 * Use case to get a single functional rank by ID
 */
@Injectable()
export class GetFunctionalRankByIdUseCase implements PromiseUseCase<
  string,
  FunctionalRank
> {
  constructor(
    private readonly functionalRankRepository: FunctionalRankRepository,
  ) {
    this.logger = new Logger('GetFunctionalRankByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<FunctionalRank>> {
    this.logger.debug(
      'delegating get functional rank by id to FunctionalRankRepository',
      { params },
    )
    return this.functionalRankRepository.getById(params)
  }
}
