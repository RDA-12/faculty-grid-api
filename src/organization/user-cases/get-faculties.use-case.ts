import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import { PromiseUseCase } from '../../common/base-use-case.js'

export class GetFacultiesParams extends Pagination {
  constructor({ page, pageSize, search }: Partial<GetFacultiesParams>) {
    super({ page, pageSize })
    this.search = search
  }

  /** Search faculties by its name */
  search?: string
}

/**
 * Use case to get all faculties
 */
@Injectable()
export class GetFacultiesUseCase implements PromiseUseCase<
  GetFacultiesParams,
  PaginatedResult<Faculty>
> {
  constructor(private readonly facultyRepository: FacultyRepository) {
    this.logger = new Logger('GetFacultiesUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetFacultiesParams,
  ): Promise<AppResult<PaginatedResult<Faculty>>> {
    this.logger.debug('delegating get all faculties to FacultyRepository')
    return this.facultyRepository.getAll(params)
  }
}
