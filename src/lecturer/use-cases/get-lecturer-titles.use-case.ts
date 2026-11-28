import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import type { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetLecturerTitlesParams extends Pagination {
  constructor({
    page,
    pageSize,
    lecturerId,
    titleId,
    facultyId,
    programId,
    activeOnly,
  }: Partial<GetLecturerTitlesParams>) {
    super({ page, pageSize })
    this.lecturerId = lecturerId
    this.titleId = titleId
    this.facultyId = facultyId
    this.programId = programId
    this.activeOnly = activeOnly
  }

  readonly lecturerId?: string
  readonly titleId?: string
  readonly facultyId?: string
  readonly programId?: string
  readonly activeOnly?: boolean
}

/**
 * Use case to get lecturer title assignments
 */
@Injectable()
export class GetLecturerTitlesUseCase implements PromiseUseCase<
  GetLecturerTitlesParams,
  PaginatedResult<LecturerTitle>
> {
  constructor(
    private readonly lecturerTitleRepository: LecturerTitleRepository,
  ) {
    this.logger = new Logger('GetLecturerTitlesUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetLecturerTitlesParams,
  ): Promise<AppResult<PaginatedResult<LecturerTitle>>> {
    this.logger.debug(
      'delegating get lecturer titles to LecturerTitleRepository',
      { params },
    )
    return this.lecturerTitleRepository.getAll(params)
  }
}
