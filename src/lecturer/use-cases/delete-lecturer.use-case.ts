import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'

/**
 * Use case to delete a lecturer
 */
@Injectable()
export class DeleteLecturerUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly lecturerRepository: LecturerRepository) {
    this.logger = new Logger('DeleteLecturerUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug('delegating deleting lecturer to LecturerRepository', {
      params,
    })
    return this.lecturerRepository.deleteById(params)
  }
}
