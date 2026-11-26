import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
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
} from './faculty.dto.js'
import { AppResult } from '../../common/app-result.js'
import { CurrentUser } from '@nestjs/authentication'
import { User } from '../../user/entities/user.entity.js'
import {
  ApiInvalidRequestResponse,
  ApiSuccessResponse,
} from '../../common/app-response.js'
import { RequiredPermisson } from '../../authz/decorators/required-permission.decorator.js'
import { FacultyPolicy } from '../policies/faculty.policy.js'
import {
  GetFacultiesParams,
  GetFacultiesUseCase,
} from '../user-cases/get-faculties.use-case.js'
import { ApiNoContentResponse } from '@nestjs/swagger'
import { DeleteFacultyUseCase } from '../user-cases/delete-faculty.use-case.js'
import { Anyone } from '../../authz/decorators/anyone.decorator.js'
import { PaginatedResult } from '../../common/pagination.js'

@Controller('faculties')
export class FacultyController {
  constructor(
    private readonly createFacultyUseCase: CreateFacultyUseCase,
    private readonly GetFacultiesUseCase: GetFacultiesUseCase,
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
    this.logger.debug('delegating creating new faculty to CreateFacultyUseCase')
    const result = await this.createFacultyUseCase.execute(
      new CreateFacultyParams({
        name: body.name,
        user: user,
      }),
    )
    if (result.exception) {
      this.logger.debug('failed to create new faculty')
      return AppResult.failed(result.exception)
    }
    this.logger.debug('faculty created')
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
    this.logger.debug('delegating get faculties to GetFacultiesUseCase')
    const result = await this.GetFacultiesUseCase.execute(
      new GetFacultiesParams(params ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get faculties')
      return AppResult.failed(result.exception)
    }
    this.logger.debug('faculties obtained')
    return AppResult.success(
      result.data!.mapData((it) => FacultyOut.fromFaculty(it)),
    )
  }

  @ApiNoContentResponse({ description: 'Faculty successfully deleted' })
  @RequiredPermisson(FacultyPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteFaculty(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete faculty to DeleteFacultyUseCase')
    const result = await this.deleteFacultyUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete faculty')
      return result
    }
  }
}
