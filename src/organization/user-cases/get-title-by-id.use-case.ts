import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Title } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'

/**
 * Use case to get a single structural title by ID
 */
@Injectable()
export class GetTitleByIdUseCase implements PromiseUseCase<string, Title> {
  constructor(private readonly titleRepository: TitleRepository) {
    this.logger = new Logger('GetTitleByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<Title>> {
    this.logger.debug('delegating get title by id to TitleRepository', {
      params,
    })
    return this.titleRepository.getById(params)
  }
}
