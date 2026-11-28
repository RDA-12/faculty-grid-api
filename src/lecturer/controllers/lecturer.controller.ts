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
import { ApiNoContentResponse } from '@nestjs/swagger'
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
import { LecturerPolicy } from '../policies/lecturer.policy.js'
import {
  CreateLecturerParams,
  CreateLecturerUseCase,
} from '../use-cases/create-lecturer.use-case.js'
import {
  GetLecturersParams,
  GetLecturersUseCase,
} from '../use-cases/get-lecturers.use-case.js'
import { GetLecturerByIdUseCase } from '../use-cases/get-lecturer-by-id.use-case.js'
import {
  UpdateLecturerParams,
  UpdateLecturerUseCase,
} from '../use-cases/update-lecturer.use-case.js'
import { DeleteLecturerUseCase } from '../use-cases/delete-lecturer.use-case.js'
import {
  CreateLecturerDTO,
  LecturerOut,
  LecturersQuery,
  UpdateLecturerDTO,
} from './lecturer.dto.js'

@Controller('lecturers')
export class LecturerController {
  constructor(
    private readonly createLecturerUseCase: CreateLecturerUseCase,
    private readonly getLecturersUseCase: GetLecturersUseCase,
    private readonly getLecturerByIdUseCase: GetLecturerByIdUseCase,
    private readonly updateLecturerUseCase: UpdateLecturerUseCase,
    private readonly deleteLecturerUseCase: DeleteLecturerUseCase,
  ) {
    this.logger = new Logger('LecturerController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Lecturer created successfully',
    model: LecturerOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Program, rank, or functional rank cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(LecturerPolicy, 'create')
  @Post()
  async createLecturer(
    @CurrentUser() user: User,
    @Body() body: CreateLecturerDTO,
  ): Promise<AppResult<LecturerOut>> {
    this.logger.debug(
      'delegating create new lecturer to CreateLecturerUseCase',
      { body },
    )
    const result = await this.createLecturerUseCase.execute(
      new CreateLecturerParams({
        name: body.name,
        displayName: body.displayName,
        programId: body.programId,
        employmentStatus: body.employmentStatus,
        rankId: body.rankId ?? null,
        functionalRankId: body.functionalRankId ?? null,
        academicDegree: body.academicDegree,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create lecturer failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturer created', { data: result.data })
    return AppResult.success(LecturerOut.fromLecturer(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Lecturers obtained successfully',
    model: LecturerOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getLecturers(
    @CurrentUser() _user: User,
    @Query() query?: LecturersQuery,
  ): Promise<AppResult<PaginatedResult<LecturerOut>>> {
    this.logger.debug('delegating get lecturers to GetLecturersUseCase', {
      query,
    })
    const result = await this.getLecturersUseCase.execute(
      new GetLecturersParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get lecturers', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturers obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => LecturerOut.fromLecturer(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Lecturer obtained successfully',
    model: LecturerOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Lecturer cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getLecturerById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<LecturerOut>> {
    this.logger.debug(
      'delegating get lecturer by id to GetLecturerByIdUseCase',
      { id },
    )
    const result = await this.getLecturerByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get lecturer by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturer obtained', { data: result.data })
    return AppResult.success(LecturerOut.fromLecturer(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Lecturer updated successfully',
    model: LecturerOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Lecturer, program, rank, or functional rank cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(LecturerPolicy, 'update')
  @Put(':id')
  async updateLecturer(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateLecturerDTO,
  ): Promise<AppResult<LecturerOut>> {
    this.logger.debug('delegating update lecturer to UpdateLecturerUseCase', {
      id,
      body,
    })
    const result = await this.updateLecturerUseCase.execute(
      new UpdateLecturerParams({
        id,
        name: body.name,
        displayName: body.displayName,
        programId: body.programId,
        employmentStatus: body.employmentStatus,
        rankId: body.rankId ?? null,
        functionalRankId: body.functionalRankId ?? null,
        academicDegree: body.academicDegree,
      }),
    )
    if (result.exception) {
      this.logger.debug('update lecturer failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturer updated', { data: result.data })
    return AppResult.success(LecturerOut.fromLecturer(result.data!))
  }

  @ApiNoContentResponse({ description: 'Lecturer successfully deleted' })
  @RequiredPermisson(LecturerPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteLecturer(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete lecturer to DeleteLecturerUseCase', {
      id,
    })
    const result = await this.deleteLecturerUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete lecturer', {
        error: result.exception,
      })
      return result
    }
    this.logger.debug('lecturer deleted')
  }
}
