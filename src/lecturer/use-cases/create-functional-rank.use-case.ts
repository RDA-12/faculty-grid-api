import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'

/**
 * Params for CreateFunctionalRankUseCase
 */
export class CreateFunctionalRankParams {
  constructor({ name, createdBy }: Required<CreateFunctionalRankParams>) {
    this.name = name
    this.createdBy = createdBy
  }

  readonly name: string
  readonly createdBy: string
}

/**
 * Use case to create new functional rank data
 */
@Injectable()
export class CreateFunctionalRankUseCase implements PromiseUseCase<
  CreateFunctionalRankParams,
  FunctionalRank
> {
  constructor(
    private readonly functionalRankRepository: FunctionalRankRepository,
  ) {
    this.logger = new Logger('CreateFunctionalRankUseCase')
  }

  private readonly logger: Logger

  execute(
    params: CreateFunctionalRankParams,
  ): Promise<AppResult<FunctionalRank>> {
    this.logger.debug(
      'delegating save new functional rank to FunctionalRankRepository',
      { params },
    )
    return this.functionalRankRepository.save(params)
  }
}
