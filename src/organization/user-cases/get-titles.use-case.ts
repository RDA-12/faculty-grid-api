import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import { type Title, TitleScope } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetTitlesParams extends Pagination {
  constructor({ page, pageSize, scope, search }: Partial<GetTitlesParams>) {
    super({ page, pageSize })
    this.scope = scope
    this.search = search
  }

  readonly scope?: TitleScope
  readonly search?: string
}

/**
 * Use case to get structural titles
 */
@Injectable()
export class GetTitlesUseCase implements PromiseUseCase<
  GetTitlesParams,
  PaginatedResult<Title>
> {
  constructor(private readonly titleRepository: TitleRepository) {
    this.logger = new Logger('GetTitlesUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetTitlesParams,
  ): Promise<AppResult<PaginatedResult<Title>>> {
    this.logger.debug('delegating get titles to TitleRepository', {
      params,
    })
    return this.titleRepository.getAll(params)
  }
}
