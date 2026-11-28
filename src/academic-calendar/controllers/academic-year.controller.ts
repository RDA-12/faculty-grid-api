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
import { AcademicYearPolicy } from '../policies/academic-year.policy.js'
import {
  CreateAcademicYearParams,
  CreateAcademicYearUseCase,
} from '../use-cases/create-academic-year.use-case.js'
import {
  GetAcademicYearsParams,
  GetAcademicYearsUseCase,
} from '../use-cases/get-academic-years.use-case.js'
import { GetAcademicYearByIdUseCase } from '../use-cases/get-academic-year-by-id.use-case.js'
import {
  UpdateAcademicYearParams,
  UpdateAcademicYearUseCase,
} from '../use-cases/update-academic-year.use-case.js'
import { DeleteAcademicYearUseCase } from '../use-cases/delete-academic-year.use-case.js'
import {
  AcademicYearOut,
  AcademicYearsQuery,
  CreateAcademicYearDTO,
  UpdateAcademicYearDTO,
} from './academic-year.dto.js'

@ApiTags('Academic Years')
@Controller('academic-years')
export class AcademicYearController {
  constructor(
    private readonly createAcademicYearUseCase: CreateAcademicYearUseCase,
    private readonly getAcademicYearsUseCase: GetAcademicYearsUseCase,
    private readonly getAcademicYearByIdUseCase: GetAcademicYearByIdUseCase,
    private readonly updateAcademicYearUseCase: UpdateAcademicYearUseCase,
    private readonly deleteAcademicYearUseCase: DeleteAcademicYearUseCase,
  ) {
    this.logger = new Logger('AcademicYearController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Academic year created successfully',
    model: AcademicYearOut,
  })
  @ApiFailedResponse({
    status: 409,
    description:
      'Academic year name already exists, overlaps with an existing academic year, or an active academic year already exists',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(AcademicYearPolicy, 'create')
  @Post()
  async createAcademicYear(
    @CurrentUser() user: User,
    @Body() body: CreateAcademicYearDTO,
  ): Promise<AppResult<AcademicYearOut>> {
    this.logger.debug(
      'delegating create new academic year to CreateAcademicYearUseCase',
      { body },
    )
    const result = await this.createAcademicYearUseCase.execute(
      new CreateAcademicYearParams({
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create academic year failed', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('academic year created', { data: result.data })
    return AppResult.success(AcademicYearOut.fromAcademicYear(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Academic years obtained successfully',
    model: AcademicYearOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getAcademicYears(
    @CurrentUser() _user: User,
    @Query() query?: AcademicYearsQuery,
  ): Promise<AppResult<PaginatedResult<AcademicYearOut>>> {
    this.logger.debug(
      'delegating get academic years to GetAcademicYearsUseCase',
      { query },
    )
    const result = await this.getAcademicYearsUseCase.execute(
      new GetAcademicYearsParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get academic years', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('academic years obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => AcademicYearOut.fromAcademicYear(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Academic year obtained successfully',
    model: AcademicYearOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Academic year cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getAcademicYearById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<AcademicYearOut>> {
    this.logger.debug(
      'delegating get academic year by id to GetAcademicYearByIdUseCase',
      { id },
    )
    const result = await this.getAcademicYearByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get academic year by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('academic year obtained', { data: result.data })
    return AppResult.success(AcademicYearOut.fromAcademicYear(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Academic year updated successfully',
    model: AcademicYearOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Academic year cannot be found',
  })
  @ApiFailedResponse({
    status: 409,
    description:
      'Academic year name already exists, overlaps with an existing academic year, or an active academic year already exists',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(AcademicYearPolicy, 'update')
  @Put(':id')
  async updateAcademicYear(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateAcademicYearDTO,
  ): Promise<AppResult<AcademicYearOut>> {
    this.logger.debug(
      'delegating update academic year to UpdateAcademicYearUseCase',
      { id, body },
    )
    const result = await this.updateAcademicYearUseCase.execute(
      new UpdateAcademicYearParams({
        id,
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status,
      }),
    )
    if (result.exception) {
      this.logger.debug('update academic year failed', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('academic year updated', { data: result.data })
    return AppResult.success(AcademicYearOut.fromAcademicYear(result.data!))
  }

  @ApiNoContentResponse({ description: 'Academic year successfully deleted' })
  @RequiredPermisson(AcademicYearPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteAcademicYear(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ) {
    this.logger.debug(
      'delegating delete academic year to DeleteAcademicYearUseCase',
      { id },
    )
    const result = await this.deleteAcademicYearUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete academic year', {
        error: result.exception,
      })
      return result
    }
    this.logger.debug('academic year deleted')
  }
}
