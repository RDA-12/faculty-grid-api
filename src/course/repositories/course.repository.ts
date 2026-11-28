import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import { CourseDBEntity } from '../../common/database/entities/course.entity.js'
import { AppResult } from '../../common/app-result.js'
import type { Course } from '../entities/course.entity.js'
import {
  AlreadyExistsException,
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'
import type { CreateCourseParams } from '../use-cases/create-course.use-case.js'
import type { GetCoursesParams } from '../use-cases/get-courses.use-case.js'
import type { UpdateCourseParams } from '../use-cases/update-course.use-case.js'

/**
 * Repository to manage course data
 */
@Injectable()
export class CourseRepository {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(CourseDBEntity)
    this.logger = new Logger('CourseRepository')
  }

  private readonly repository: Repository<CourseDBEntity>
  private readonly logger: Logger

  async save(params: CreateCourseParams): Promise<AppResult<Course>> {
    try {
      this.logger.debug('start saving new course', { params })
      const courseDb = await this.repository.save(
        CourseDBEntity.fromParams(params),
      )
      this.logger.debug('course saved', { data: courseDb })
      return AppResult.success(courseDb.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          return AppResult.failed(
            new AlreadyExistsException(
              `course with code ${params.code} already exists in program ${params.programId}`,
            ),
          )
        }
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `program with ID ${params.programId} or user with ID ${params.createdBy} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to save course', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getAll(
    params?: GetCoursesParams,
  ): Promise<AppResult<PaginatedResult<Course>>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const query = this.repository.createQueryBuilder('courses')
    if (params?.programId) {
      this.logger.debug('filter courses by programId')
      query.andWhere('courses.program_id = :programId', {
        programId: params.programId,
      })
    }
    if (params?.semester !== undefined) {
      this.logger.debug('filter courses by semester')
      query.andWhere('courses.semester = :semester', {
        semester: params.semester,
      })
    }
    if (params?.courseType) {
      this.logger.debug('filter courses by courseType')
      query.andWhere('courses.course_type = :courseType', {
        courseType: params.courseType,
      })
    }
    if (params?.search) {
      this.logger.debug('filter courses by code or name')
      query.andWhere(
        '(courses.code LIKE :search OR courses.name LIKE :search)',
        {
          search: `%${params.search}%`,
        },
      )
    }
    this.logger.debug('start getting all courses', { params })
    const [rows, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy({
        'courses.created_at': 'DESC',
      })
      .getManyAndCount()
    this.logger.debug('courses obtained', { rows, total })
    const courses = rows.map((it) => it.toDomain())
    return AppResult.success(
      new PaginatedResult({
        data: courses,
        pagination: new PaginationResult({
          page: page,
          pageSize: pageSize,
          total: total,
        }),
      }),
    )
  }

  async getById(id: string): Promise<AppResult<Course>> {
    this.logger.debug('start getting course by id', { id })
    const courseDb = await this.repository.findOne({
      where: { id },
    })
    if (!courseDb) {
      this.logger.debug('course not found', { id })
      return AppResult.failed(
        new NotFoundException(`course with ID ${id} is not found`),
      )
    }
    this.logger.debug('course obtained', { data: courseDb })
    return AppResult.success(courseDb.toDomain())
  }

  async update(params: UpdateCourseParams): Promise<AppResult<Course>> {
    try {
      this.logger.debug('start updating course', { params })
      const courseDb = await this.repository.findOne({
        where: { id: params.id },
      })
      if (!courseDb) {
        this.logger.debug('course not found for update', { id: params.id })
        return AppResult.failed(
          new NotFoundException(`course with ID ${params.id} is not found`),
        )
      }
      courseDb.code = params.code
      courseDb.name = params.name
      courseDb.credits = params.credits
      courseDb.semester = params.semester
      courseDb.courseType = params.courseType
      courseDb.programId = params.programId
      const updated = await this.repository.save(courseDb)
      this.logger.debug('course updated', { data: updated })
      return AppResult.success(updated.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        if (code === '23505') {
          return AppResult.failed(
            new AlreadyExistsException(
              `course with code ${params.code} already exists in program ${params.programId}`,
            ),
          )
        }
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(
              `program with ID ${params.programId} is not found`,
            ),
          )
        }
      }
      this.logger.error('failed to update course', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async deleteById(id: string): Promise<AppResult<null>> {
    this.logger.debug('start get course', { id })
    const courseDb = await this.repository.findOne({
      where: { id },
    })
    if (!courseDb) {
      this.logger.debug('course not found. skip deletion')
      return AppResult.success(null)
    }
    this.logger.debug('start deleting course')
    await this.repository.softRemove(courseDb)
    this.logger.debug('course deleted')
    return AppResult.success(null)
  }
}
