import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'

/**
 * Use case to get a single lecturer title assignment by ID
 */
@Injectable()
export class GetLecturerTitleByIdUseCase implements PromiseUseCase<
  string,
  LecturerTitle
> {
  constructor(
    private readonly lecturerTitleRepository: LecturerTitleRepository,
  ) {
    this.logger = new Logger('GetLecturerTitleByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<LecturerTitle>> {
    this.logger.debug(
      'delegating get lecturer title by id to LecturerTitleRepository',
      { params },
    )
    return this.lecturerTitleRepository.getById(params)
  }
}
