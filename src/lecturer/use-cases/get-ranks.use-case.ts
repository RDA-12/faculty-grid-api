import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import { RankType, type Rank } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetRanksParams extends Pagination {
  constructor({ page, pageSize, type, search }: Partial<GetRanksParams>) {
    super({ page, pageSize })
    this.type = type
    this.search = search
  }

  readonly type?: RankType
  readonly search?: string
}

/**
 * Use case to get ranks
 */
@Injectable()
export class GetRanksUseCase implements PromiseUseCase<
  GetRanksParams,
  PaginatedResult<Rank>
> {
  constructor(private readonly rankRepository: RankRepository) {
    this.logger = new Logger('GetRanksUseCase')
  }

  private readonly logger: Logger

  execute(params?: GetRanksParams): Promise<AppResult<PaginatedResult<Rank>>> {
    this.logger.debug('delegating get ranks to RankRepository', { params })
    return this.rankRepository.getAll(params)
  }
}
