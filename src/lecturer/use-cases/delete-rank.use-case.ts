import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { RankRepository } from '../repositories/rank.repository.js'

/**
 * Use case to delete a rank
 */
@Injectable()
export class DeleteRankUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly rankRepository: RankRepository) {
    this.logger = new Logger('DeleteRankUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug('delegating deleting rank to RankRepository', { params })
    return this.rankRepository.deleteById(params)
  }
}
