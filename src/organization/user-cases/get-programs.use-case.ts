import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import { Program } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'
import { AppResult } from '../../common/app-result.js'

export class GetProgramsParams extends Pagination {
  constructor({ page, pageSize, facultyId }: Partial<GetProgramsParams>) {
    super({ page, pageSize })
    this.facultyId = facultyId
  }

  readonly facultyId?: string
}

/**
 * Use case to get programs
 */
@Injectable()
export class GetProgramsUseCase implements PromiseUseCase<
  GetProgramsParams,
  PaginatedResult<Program>
> {
  constructor(private readonly programRepository: ProgramRepository) {
    this.logger = new Logger('GetProgramsUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetProgramsParams,
  ): Promise<AppResult<PaginatedResult<Program>>> {
    this.logger.debug('delegating get programs to ProgramRepository')
    return this.programRepository.getAll(params)
  }
}
