import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { PaginatedResult, Pagination } from '../../common/pagination.js'
import type { Course, CourseType } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'
import type { AppResult } from '../../common/app-result.js'

export class GetCoursesParams extends Pagination {
  constructor({
    page,
    pageSize,
    programId,
    semester,
    courseType,
    search,
  }: Partial<GetCoursesParams>) {
    super({ page, pageSize })
    this.programId = programId
    this.semester = semester
    this.courseType = courseType
    this.search = search
  }

  readonly programId?: string
  readonly semester?: number
  readonly courseType?: CourseType
  readonly search?: string
}

/**
 * Use case to get courses
 */
@Injectable()
export class GetCoursesUseCase implements PromiseUseCase<
  GetCoursesParams,
  PaginatedResult<Course>
> {
  constructor(private readonly courseRepository: CourseRepository) {
    this.logger = new Logger('GetCoursesUseCase')
  }

  private readonly logger: Logger

  execute(
    params?: GetCoursesParams,
  ): Promise<AppResult<PaginatedResult<Course>>> {
    this.logger.debug('delegating get courses to CourseRepository', { params })
    return this.courseRepository.getAll(params)
  }
}
