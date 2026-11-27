import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { TitleRepository } from '../repositories/title.repository.js'

/**
 * Use case to delete a structural title
 */
@Injectable()
export class DeleteTitleUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly titleRepository: TitleRepository) {
    this.logger = new Logger('DeleteTitleUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug('delegating deleting title to TitleRepository', {
      params,
    })
    return this.titleRepository.deleteById(params)
  }
}
