import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { RankType, type Rank } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'

/**
 * Params for UpdateRankUseCase
 */
export class UpdateRankParams {
  constructor({ id, name, type }: Required<UpdateRankParams>) {
    this.id = id
    this.name = name
    this.type = type
  }

  readonly id: string
  readonly name: string
  readonly type: RankType
}

/**
 * Use case to update an existing rank
 */
@Injectable()
export class UpdateRankUseCase implements PromiseUseCase<
  UpdateRankParams,
  Rank
> {
  constructor(private readonly rankRepository: RankRepository) {
    this.logger = new Logger('UpdateRankUseCase')
  }

  private readonly logger: Logger

  execute(params: UpdateRankParams): Promise<AppResult<Rank>> {
    this.logger.debug('delegating update rank to RankRepository', { params })
    return this.rankRepository.update(params)
  }
}
