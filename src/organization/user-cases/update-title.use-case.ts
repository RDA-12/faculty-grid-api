import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { type Title, TitleScope } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'

/**
 * Params for UpdateTitleUseCase
 */
export class UpdateTitleParams {
  constructor({ id, name, scope }: Required<UpdateTitleParams>) {
    this.id = id
    this.name = name
    this.scope = scope
  }

  readonly id: string
  readonly name: string
  readonly scope: TitleScope
}

/**
 * Use case to update an existing structural title
 */
@Injectable()
export class UpdateTitleUseCase implements PromiseUseCase<
  UpdateTitleParams,
  Title
> {
  constructor(private readonly titleRepository: TitleRepository) {
    this.logger = new Logger('UpdateTitleUseCase')
  }

  private readonly logger: Logger

  execute(params: UpdateTitleParams): Promise<AppResult<Title>> {
    this.logger.debug('delegating update title to TitleRepository', {
      params,
    })
    return this.titleRepository.update(params)
  }
}
