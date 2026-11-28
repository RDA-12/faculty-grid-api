import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Course, CourseType } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'

/**
 * Params for UpdateCourseUseCase
 */
export class UpdateCourseParams {
  constructor({
    id,
    code,
    name,
    credits,
    semester,
    courseType,
    programId,
  }: Required<UpdateCourseParams>) {
    this.id = id
    this.code = code
    this.name = name
    this.credits = credits
    this.semester = semester
    this.courseType = courseType
    this.programId = programId
  }

  readonly id: string
  readonly code: string
  readonly name: string
  readonly credits: number
  readonly semester: number
  readonly courseType: CourseType
  readonly programId: string
}

/**
 * Use case to update an existing course
 */
@Injectable()
export class UpdateCourseUseCase implements PromiseUseCase<
  UpdateCourseParams,
  Course
> {
  constructor(private readonly courseRepository: CourseRepository) {
    this.logger = new Logger('UpdateCourseUseCase')
  }

  private readonly logger: Logger

  execute(params: UpdateCourseParams): Promise<AppResult<Course>> {
    this.logger.debug('delegating update course to CourseRepository', {
      params,
    })
    return this.courseRepository.update(params)
  }
}
