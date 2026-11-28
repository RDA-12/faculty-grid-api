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
import {
  CreateFacultyParams,
  CreateFacultyUseCase,
} from '../user-cases/create-faculty.use-case.js'
import {
  CreateFacultyDTO,
  FacultyOut,
  GetFacultiesQuery,
  UpdateFacultyDTO,
} from './faculty.dto.js'
import { AppResult } from '../../common/app-result.js'
import { CurrentUser } from '@nestjs/authentication'
import { User } from '../../user/entities/user.entity.js'
import {
  ApiFailedResponse,
  ApiInvalidRequestResponse,
  ApiSuccessResponse,
} from '../../common/app-response.js'
import { RequiredPermisson } from '../../authz/decorators/required-permission.decorator.js'
import { FacultyPolicy } from '../policies/faculty.policy.js'
import {
  GetFacultiesParams,
  GetFacultiesUseCase,
} from '../user-cases/get-faculties.use-case.js'
import { GetFacultyByIdUseCase } from '../user-cases/get-faculty-by-id.use-case.js'
import {
  UpdateFacultyParams,
  UpdateFacultyUseCase,
} from '../user-cases/update-faculty.use-case.js'
import { ApiNoContentResponse } from '@nestjs/swagger'
import { DeleteFacultyUseCase } from '../user-cases/delete-faculty.use-case.js'
import { Anyone } from '../../authz/decorators/anyone.decorator.js'
import { PaginatedResult } from '../../common/pagination.js'

@Controller('faculties')
export class FacultyController {
  constructor(
    private readonly createFacultyUseCase: CreateFacultyUseCase,
    private readonly GetFacultiesUseCase: GetFacultiesUseCase,
    private readonly getFacultyByIdUseCase: GetFacultyByIdUseCase,
    private readonly updateFacultyUseCase: UpdateFacultyUseCase,
    private readonly deleteFacultyUseCase: DeleteFacultyUseCase,
  ) {
    this.logger = new Logger('FacultyController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    model: FacultyOut,
    description: 'New Faculty successfully created',
  })
  @ApiInvalidRequestResponse({
    description: 'Invalid data on the body',
  })
  @RequiredPermisson(FacultyPolicy, 'create')
  @Post()
  async creatFaculty(
    @CurrentUser() user: User,
    @Body() body: CreateFacultyDTO,
  ): Promise<AppResult<FacultyOut>> {
    this.logger.debug(
      'delegating creating new faculty to CreateFacultyUseCase',
      { body },
    )
    const result = await this.createFacultyUseCase.execute(
      new CreateFacultyParams({
        name: body.name,
        user: user,
      }),
    )
    if (result.exception) {
      this.logger.debug('failed to create new faculty', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('faculty created', { data: result.data })
    return AppResult.success(FacultyOut.fromFaculty(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Faculties obtained successfully',
    model: FacultyOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getFaculties(
    @CurrentUser() _user: User,
    @Query() params?: GetFacultiesQuery,
  ): Promise<AppResult<PaginatedResult<FacultyOut>>> {
    this.logger.debug('delegating get faculties to GetFacultiesUseCase', {
      params,
    })
    const result = await this.GetFacultiesUseCase.execute(
      new GetFacultiesParams(params ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get faculties', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('faculties obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => FacultyOut.fromFaculty(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Faculty obtained successfully',
    model: FacultyOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Faculty cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getFacultyById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<FacultyOut>> {
    this.logger.debug('delegating get faculty by id to GetFacultyByIdUseCase', {
      id,
    })
    const result = await this.getFacultyByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get faculty by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('faculty obtained', { data: result.data })
    return AppResult.success(FacultyOut.fromFaculty(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Faculty updated successfully',
    model: FacultyOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Faculty cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'Invalid data on the body',
  })
  @RequiredPermisson(FacultyPolicy, 'update')
  @Put(':id')
  async updateFaculty(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateFacultyDTO,
  ): Promise<AppResult<FacultyOut>> {
    this.logger.debug('delegating update faculty to UpdateFacultyUseCase', {
      id,
      body,
    })
    const result = await this.updateFacultyUseCase.execute(
      new UpdateFacultyParams({
        id,
        name: body.name,
      }),
    )
    if (result.exception) {
      this.logger.debug('failed to update faculty', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('faculty updated', { data: result.data })
    return AppResult.success(FacultyOut.fromFaculty(result.data!))
  }

  @ApiNoContentResponse({ description: 'Faculty successfully deleted' })
  @RequiredPermisson(FacultyPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteFaculty(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete faculty to DeleteFacultyUseCase', {
      id,
    })
    const result = await this.deleteFacultyUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete faculty', { error: result.exception })
      return result
    }
    this.logger.debug('faculty deleted')
  }
}
