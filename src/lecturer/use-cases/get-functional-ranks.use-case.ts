import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import type { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetFunctionalRanksParams extends Pagination {
  constructor({ page, pageSize, search }: Partial<GetFunctionalRanksParams>) {
    super({ page, pageSize })
    this.search = search
  }

  readonly search?: string
}

/**
 * Use case to get functional ranks
 */
@Injectable()
export class GetFunctionalRanksUseCase implements PromiseUseCase<
  GetFunctionalRanksParams,
  PaginatedResult<FunctionalRank>
> {
  constructor(
    private readonly functionalRankRepository: FunctionalRankRepository,
  ) {
    this.logger = new Logger('GetFunctionalRanksUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetFunctionalRanksParams,
  ): Promise<AppResult<PaginatedResult<FunctionalRank>>> {
    this.logger.debug(
      'delegating get functional ranks to FunctionalRankRepository',
      { params },
    )
    return this.functionalRankRepository.getAll(params)
  }
}
