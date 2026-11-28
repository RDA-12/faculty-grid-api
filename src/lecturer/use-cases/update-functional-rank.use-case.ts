import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'

/**
 * Params for UpdateFunctionalRankUseCase
 */
export class UpdateFunctionalRankParams {
  constructor({ id, name }: Required<UpdateFunctionalRankParams>) {
    this.id = id
    this.name = name
  }

  readonly id: string
  readonly name: string
}

/**
 * Use case to update an existing functional rank
 */
@Injectable()
export class UpdateFunctionalRankUseCase implements PromiseUseCase<
  UpdateFunctionalRankParams,
  FunctionalRank
> {
  constructor(
    private readonly functionalRankRepository: FunctionalRankRepository,
  ) {
    this.logger = new Logger('UpdateFunctionalRankUseCase')
  }

  private readonly logger: Logger

  execute(
    params: UpdateFunctionalRankParams,
  ): Promise<AppResult<FunctionalRank>> {
    this.logger.debug(
      'delegating update functional rank to FunctionalRankRepository',
      { params },
    )
    return this.functionalRankRepository.update(params)
  }
}
