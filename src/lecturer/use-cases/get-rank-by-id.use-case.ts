import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Rank } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'

/**
 * Use case to get a single rank by ID
 */
@Injectable()
export class GetRankByIdUseCase implements PromiseUseCase<string, Rank> {
  constructor(private readonly rankRepository: RankRepository) {
    this.logger = new Logger('GetRankByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<Rank>> {
    this.logger.debug('delegating get rank by id to RankRepository', { params })
    return this.rankRepository.getById(params)
  }
}
