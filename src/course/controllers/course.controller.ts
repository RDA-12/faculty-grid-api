import { CurrentUser } from '@nestjs/authentication'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import { User } from '../../user/entities/user.entity.js'
import { RequiredPermisson } from '../../authz/decorators/required-permission.decorator.js'
import { Anyone } from '../../authz/decorators/anyone.decorator.js'
import {
  ApiFailedResponse,
  ApiInvalidRequestResponse,
  ApiSuccessResponse,
} from '../../common/app-response.js'
import { AppResult } from '../../common/app-result.js'
import { PaginatedResult } from '../../common/pagination.js'
import { CoursePolicy } from '../policies/course.policy.js'
import {
  CreateCourseParams,
  CreateCourseUseCase,
} from '../use-cases/create-course.use-case.js'
import {
  GetCoursesParams,
  GetCoursesUseCase,
} from '../use-cases/get-courses.use-case.js'
import { GetCourseByIdUseCase } from '../use-cases/get-course-by-id.use-case.js'
import {
  UpdateCourseParams,
  UpdateCourseUseCase,
} from '../use-cases/update-course.use-case.js'
import { DeleteCourseUseCase } from '../use-cases/delete-course.use-case.js'
import {
  CourseOut,
  CoursesQuery,
  CreateCourseDTO,
  UpdateCourseDTO,
} from './course.dto.js'

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly getCoursesUseCase: GetCoursesUseCase,
    private readonly getCourseByIdUseCase: GetCourseByIdUseCase,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
    private readonly deleteCourseUseCase: DeleteCourseUseCase,
  ) {
    this.logger = new Logger('CourseController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Course created successfully',
    model: CourseOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Program cannot be found',
  })
  @ApiFailedResponse({
    status: 409,
    description: 'Course with the same code already exists in this program',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(CoursePolicy, 'create')
  @Post()
  async createCourse(
    @CurrentUser() user: User,
    @Body() body: CreateCourseDTO,
  ): Promise<AppResult<CourseOut>> {
    this.logger.debug('delegating create new course to CreateCourseUseCase', {
      body,
    })
    const result = await this.createCourseUseCase.execute(
      new CreateCourseParams({
        code: body.code,
        name: body.name,
        credits: body.credits,
        semester: body.semester,
        courseType: body.courseType,
        programId: body.programId,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create course failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('course created', { data: result.data })
    return AppResult.success(CourseOut.fromCourse(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Courses obtained successfully',
    model: CourseOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getCourses(
    @CurrentUser() _user: User,
    @Query() query?: CoursesQuery,
  ): Promise<AppResult<PaginatedResult<CourseOut>>> {
    this.logger.debug('delegating get courses to GetCoursesUseCase', {
      query,
    })
    const result = await this.getCoursesUseCase.execute(
      new GetCoursesParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get courses', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('courses obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => CourseOut.fromCourse(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Course obtained successfully',
    model: CourseOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Course cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getCourseById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<CourseOut>> {
    this.logger.debug('delegating get course by id to GetCourseByIdUseCase', {
      id,
    })
    const result = await this.getCourseByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get course by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('course obtained', { data: result.data })
    return AppResult.success(CourseOut.fromCourse(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Course updated successfully',
    model: CourseOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Course or program cannot be found',
  })
  @ApiFailedResponse({
    status: 409,
    description: 'Course with the same code already exists in this program',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(CoursePolicy, 'update')
  @Put(':id')
  async updateCourse(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateCourseDTO,
  ): Promise<AppResult<CourseOut>> {
    this.logger.debug('delegating update course to UpdateCourseUseCase', {
      id,
      body,
    })
    const result = await this.updateCourseUseCase.execute(
      new UpdateCourseParams({
        id,
        code: body.code,
        name: body.name,
        credits: body.credits,
        semester: body.semester,
        courseType: body.courseType,
        programId: body.programId,
      }),
    )
    if (result.exception) {
      this.logger.debug('update course failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('course updated', { data: result.data })
    return AppResult.success(CourseOut.fromCourse(result.data!))
  }

  @ApiNoContentResponse({ description: 'Course successfully deleted' })
  @RequiredPermisson(CoursePolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteCourse(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete course to DeleteCourseUseCase', {
      id,
    })
    const result = await this.deleteCourseUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete course', { error: result.exception })
      return result
    }
    this.logger.debug('course deleted')
  }
}
