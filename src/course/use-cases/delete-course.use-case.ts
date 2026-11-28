import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import { CourseRepository } from '../repositories/course.repository.js'

/**
 * Use case to delete a course
 */
@Injectable()
export class DeleteCourseUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly courseRepository: CourseRepository) {
    this.logger = new Logger('DeleteCourseUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug('delegating deleting course to CourseRepository', {
      params,
    })
    return this.courseRepository.deleteById(params)
  }
}
