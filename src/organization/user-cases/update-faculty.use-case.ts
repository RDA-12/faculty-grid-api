import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'

/**
 * Params for UpdateFacultyUseCase
 */
export class UpdateFacultyParams {
  constructor({ id, name }: Required<UpdateFacultyParams>) {
    this.id = id
    this.name = name
  }

  readonly id: string
  readonly name: string
}

/**
 * Use case to update an existing faculty
 */
@Injectable()
export class UpdateFacultyUseCase implements PromiseUseCase<
  UpdateFacultyParams,
  Faculty
> {
  constructor(private readonly facultyRepository: FacultyRepository) {
    this.logger = new Logger('UpdateFacultyUseCase')
  }

  private readonly logger: Logger

  execute(params: UpdateFacultyParams): Promise<AppResult<Faculty>> {
    this.logger.debug('delegating update faculty to FacultyRepository', {
      params,
    })
    return this.facultyRepository.update(params)
  }
}
