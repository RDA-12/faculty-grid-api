import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { type Title, TitleScope } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'

/**
 * Params for CreateTitleUseCase
 */
export class CreateTitleParams {
  constructor({ name, scope, createdBy }: Required<CreateTitleParams>) {
    this.name = name
    this.scope = scope
    this.createdBy = createdBy
  }

  readonly name: string
  readonly scope: TitleScope
  readonly createdBy: string
}

/**
 * Use case to create new structural title data
 */
@Injectable()
export class CreateTitleUseCase implements PromiseUseCase<
  CreateTitleParams,
  Title
> {
  constructor(private readonly titleRepository: TitleRepository) {
    this.logger = new Logger('CreateTitleUseCase')
  }

  private readonly logger: Logger

  execute(params: CreateTitleParams): Promise<AppResult<Title>> {
    this.logger.debug('delegating save new title to TitleRepository', {
      params,
    })
    return this.titleRepository.save(params)
  }
}
