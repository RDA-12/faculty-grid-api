import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Lecturer } from '../entities/lecturer.entity.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'

/**
 * Use case to get a single lecturer by ID
 */
@Injectable()
export class GetLecturerByIdUseCase implements PromiseUseCase<
  string,
  Lecturer
> {
  constructor(private readonly lecturerRepository: LecturerRepository) {
    this.logger = new Logger('GetLecturerByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<Lecturer>> {
    this.logger.debug('delegating get lecturer by id to LecturerRepository', {
      params,
    })
    return this.lecturerRepository.getById(params)
  }
}
