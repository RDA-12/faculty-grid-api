import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Course, CourseType } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'

/**
 * Params for CreateCourseUseCase
 */
export class CreateCourseParams {
  constructor({
    code,
    name,
    credits,
    semester,
    courseType,
    programId,
    createdBy,
  }: Required<CreateCourseParams>) {
    this.code = code
    this.name = name
    this.credits = credits
    this.semester = semester
    this.courseType = courseType
    this.programId = programId
    this.createdBy = createdBy
  }

  readonly code: string
  readonly name: string
  readonly credits: number
  readonly semester: number
  readonly courseType: CourseType
  readonly programId: string
  readonly createdBy: string
}

/**
 * Use case to create a new course
 */
@Injectable()
export class CreateCourseUseCase implements PromiseUseCase<
  CreateCourseParams,
  Course
> {
  constructor(private readonly courseRepository: CourseRepository) {
    this.logger = new Logger('CreateCourseUseCase')
  }

  private readonly logger: Logger

  execute(params: CreateCourseParams): Promise<AppResult<Course>> {
    this.logger.debug('delegating save new course to CourseRepository', {
      params,
    })
    return this.courseRepository.save(params)
  }
}
