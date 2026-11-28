import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { RankType, type Rank } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'

/**
 * Params for CreateRankUseCase
 */
export class CreateRankParams {
  constructor({ name, type, createdBy }: Required<CreateRankParams>) {
    this.name = name
    this.type = type
    this.createdBy = createdBy
  }

  readonly name: string
  readonly type: RankType
  readonly createdBy: string
}

/**
 * Use case to create new rank data
 */
@Injectable()
export class CreateRankUseCase implements PromiseUseCase<
  CreateRankParams,
  Rank
> {
  constructor(private readonly rankRepository: RankRepository) {
    this.logger = new Logger('CreateRankUseCase')
  }

  private readonly logger: Logger

  execute(params: CreateRankParams): Promise<AppResult<Rank>> {
    this.logger.debug('delegating save new rank to RankRepository', { params })
    return this.rankRepository.save(params)
  }
}
