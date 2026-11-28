import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Course } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'

/**
 * Use case to get a single course by ID
 */
@Injectable()
export class GetCourseByIdUseCase implements PromiseUseCase<string, Course> {
  constructor(private readonly courseRepository: CourseRepository) {
    this.logger = new Logger('GetCourseByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<Course>> {
    this.logger.debug('delegating get course by id to CourseRepository', {
      params,
    })
    return this.courseRepository.getById(params)
  }
}
