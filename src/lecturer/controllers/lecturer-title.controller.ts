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
import { LecturerTitlePolicy } from '../policies/lecturer-title.policy.js'
import {
  CreateLecturerTitleParams,
  CreateLecturerTitleUseCase,
} from '../use-cases/create-lecturer-title.use-case.js'
import {
  GetLecturerTitlesParams,
  GetLecturerTitlesUseCase,
} from '../use-cases/get-lecturer-titles.use-case.js'
import { GetLecturerTitleByIdUseCase } from '../use-cases/get-lecturer-title-by-id.use-case.js'
import {
  UpdateLecturerTitleParams,
  UpdateLecturerTitleUseCase,
} from '../use-cases/update-lecturer-title.use-case.js'
import { DeleteLecturerTitleUseCase } from '../use-cases/delete-lecturer-title.use-case.js'
import {
  CreateLecturerTitleDTO,
  LecturerTitleOut,
  LecturerTitlesQuery,
  UpdateLecturerTitleDTO,
} from './lecturer-title.dto.js'

@Controller('lecturer-titles')
export class LecturerTitleController {
  constructor(
    private readonly createLecturerTitleUseCase: CreateLecturerTitleUseCase,
    private readonly getLecturerTitlesUseCase: GetLecturerTitlesUseCase,
    private readonly getLecturerTitleByIdUseCase: GetLecturerTitleByIdUseCase,
    private readonly updateLecturerTitleUseCase: UpdateLecturerTitleUseCase,
    private readonly deleteLecturerTitleUseCase: DeleteLecturerTitleUseCase,
  ) {
    this.logger = new Logger('LecturerTitleController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Lecturer title assigned successfully',
    model: LecturerTitleOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Lecturer, title, faculty, or program cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(LecturerTitlePolicy, 'create')
  @Post()
  async createLecturerTitle(
    @CurrentUser() user: User,
    @Body() body: CreateLecturerTitleDTO,
  ): Promise<AppResult<LecturerTitleOut>> {
    this.logger.debug(
      'delegating assign lecturer title to CreateLecturerTitleUseCase',
      { body },
    )
    const result = await this.createLecturerTitleUseCase.execute(
      new CreateLecturerTitleParams({
        lecturerId: body.lecturerId,
        titleId: body.titleId,
        facultyId: body.facultyId ?? null,
        programId: body.programId ?? null,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create lecturer title failed', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturer title created', { data: result.data })
    return AppResult.success(LecturerTitleOut.fromLecturerTitle(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Lecturer titles obtained successfully',
    model: LecturerTitleOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getLecturerTitles(
    @CurrentUser() _user: User,
    @Query() query?: LecturerTitlesQuery,
  ): Promise<AppResult<PaginatedResult<LecturerTitleOut>>> {
    this.logger.debug(
      'delegating get lecturer titles to GetLecturerTitlesUseCase',
      { query },
    )
    const result = await this.getLecturerTitlesUseCase.execute(
      new GetLecturerTitlesParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get lecturer titles', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturer titles obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => LecturerTitleOut.fromLecturerTitle(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Lecturer title obtained successfully',
    model: LecturerTitleOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Lecturer title cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getLecturerTitleById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<LecturerTitleOut>> {
    this.logger.debug(
      'delegating get lecturer title by id to GetLecturerTitleByIdUseCase',
      { id },
    )
    const result = await this.getLecturerTitleByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get lecturer title by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturer title obtained', { data: result.data })
    return AppResult.success(LecturerTitleOut.fromLecturerTitle(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Lecturer title updated successfully',
    model: LecturerTitleOut,
  })
  @ApiFailedResponse({
    status: 404,
    description:
      'Lecturer title, lecturer, title, faculty, or program cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(LecturerTitlePolicy, 'update')
  @Put(':id')
  async updateLecturerTitle(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateLecturerTitleDTO,
  ): Promise<AppResult<LecturerTitleOut>> {
    this.logger.debug(
      'delegating update lecturer title to UpdateLecturerTitleUseCase',
      { id, body },
    )
    const result = await this.updateLecturerTitleUseCase.execute(
      new UpdateLecturerTitleParams({
        id,
        lecturerId: body.lecturerId,
        titleId: body.titleId,
        facultyId: body.facultyId ?? null,
        programId: body.programId ?? null,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
      }),
    )
    if (result.exception) {
      this.logger.debug('update lecturer title failed', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('lecturer title updated', { data: result.data })
    return AppResult.success(LecturerTitleOut.fromLecturerTitle(result.data!))
  }

  @ApiNoContentResponse({
    description: 'Lecturer title successfully deleted',
  })
  @RequiredPermisson(LecturerTitlePolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteLecturerTitle(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ) {
    this.logger.debug(
      'delegating delete lecturer title to DeleteLecturerTitleUseCase',
      { id },
    )
    const result = await this.deleteLecturerTitleUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete lecturer title', {
        error: result.exception,
      })
      return result
    }
    this.logger.debug('lecturer title deleted')
  }
}
