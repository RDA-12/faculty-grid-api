import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'

/**
 * Use case to delete a lecturer title assignment
 */
@Injectable()
export class DeleteLecturerTitleUseCase implements PromiseUseCase<
  string,
  null
> {
  constructor(
    private readonly lecturerTitleRepository: LecturerTitleRepository,
  ) {
    this.logger = new Logger('DeleteLecturerTitleUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug(
      'delegating deleting lecturer title to LecturerTitleRepository',
      { params },
    )
    return this.lecturerTitleRepository.deleteById(params)
  }
}
