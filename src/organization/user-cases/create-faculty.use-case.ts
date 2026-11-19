import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { Faculty } from '../entities/faculty.entity.js'
import { AppResult } from '../../common/app-result.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import { User } from '../../user/entities/user.entity.js'

/**
 * Params for CreateFacultyUseCase
 */
export class CreateFacultyParams {
  constructor({ name, user }: Required<CreateFacultyParams>) {
    this.name = name
    this.user = user
  }

  readonly name: string
  readonly user: User
}

/**
 * Use case to create new faculty data
 */
@Injectable()
export class CreateFacultyUseCase implements PromiseUseCase<
  CreateFacultyParams,
  Faculty
> {
  constructor(private readonly facultyRepository: FacultyRepository) {
    this.logger = new Logger('CreateFacultyUseCase')
  }

  private readonly logger: Logger

  execute(params: CreateFacultyParams): Promise<AppResult<Faculty>> {
    this.logger.debug('delegating save new faculty to FacultyRepository')
    return this.facultyRepository.save(params.name, params.user.id)
  }
}
