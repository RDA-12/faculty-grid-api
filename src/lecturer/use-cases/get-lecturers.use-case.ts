import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import {
  AcademicDegree,
  EmploymentStatus,
  type Lecturer,
} from '../entities/lecturer.entity.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetLecturersParams extends Pagination {
  constructor({
    page,
    pageSize,
    programId,
    employmentStatus,
    rankId,
    functionalRankId,
    academicDegree,
    search,
  }: Partial<GetLecturersParams>) {
    super({ page, pageSize })
    this.programId = programId
    this.employmentStatus = employmentStatus
    this.rankId = rankId
    this.functionalRankId = functionalRankId
    this.academicDegree = academicDegree
    this.search = search
  }

  readonly programId?: string
  readonly employmentStatus?: EmploymentStatus
  readonly rankId?: string
  readonly functionalRankId?: string
  readonly academicDegree?: AcademicDegree
  readonly search?: string
}

/**
 * Use case to get lecturers
 */
@Injectable()
export class GetLecturersUseCase implements PromiseUseCase<
  GetLecturersParams,
  PaginatedResult<Lecturer>
> {
  constructor(private readonly lecturerRepository: LecturerRepository) {
    this.logger = new Logger('GetLecturersUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetLecturersParams,
  ): Promise<AppResult<PaginatedResult<Lecturer>>> {
    this.logger.debug('delegating get lecturers to LecturerRepository', {
      params,
    })
    return this.lecturerRepository.getAll(params)
  }
}
