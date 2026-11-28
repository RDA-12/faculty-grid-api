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
import { TermPolicy } from '../policies/term.policy.js'
import {
  CreateTermParams,
  CreateTermUseCase,
} from '../use-cases/create-term.use-case.js'
import {
  GetTermsParams,
  GetTermsUseCase,
} from '../use-cases/get-terms.use-case.js'
import { GetTermByIdUseCase } from '../use-cases/get-term-by-id.use-case.js'
import {
  UpdateTermParams,
  UpdateTermUseCase,
} from '../use-cases/update-term.use-case.js'
import { DeleteTermUseCase } from '../use-cases/delete-term.use-case.js'
import {
  CreateTermDTO,
  TermOut,
  TermsQuery,
  UpdateTermDTO,
} from './term.dto.js'

@ApiTags('Terms')
@Controller('terms')
export class TermController {
  constructor(
    private readonly createTermUseCase: CreateTermUseCase,
    private readonly getTermsUseCase: GetTermsUseCase,
    private readonly getTermByIdUseCase: GetTermByIdUseCase,
    private readonly updateTermUseCase: UpdateTermUseCase,
    private readonly deleteTermUseCase: DeleteTermUseCase,
  ) {
    this.logger = new Logger('TermController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Term created successfully',
    model: TermOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Academic year cannot be found',
  })
  @ApiFailedResponse({
    status: 409,
    description:
      'Term name already exists in this academic year, overlaps with an existing term, an active term already exists, or academic year is not active',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(TermPolicy, 'create')
  @Post()
  async createTerm(
    @CurrentUser() user: User,
    @Body() body: CreateTermDTO,
  ): Promise<AppResult<TermOut>> {
    this.logger.debug('delegating create new term to CreateTermUseCase', {
      body,
    })
    const result = await this.createTermUseCase.execute(
      new CreateTermParams({
        academicYearId: body.academicYearId,
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create term failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('term created', { data: result.data })
    return AppResult.success(TermOut.fromTerm(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Terms obtained successfully',
    model: TermOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getTerms(
    @CurrentUser() _user: User,
    @Query() query?: TermsQuery,
  ): Promise<AppResult<PaginatedResult<TermOut>>> {
    this.logger.debug('delegating get terms to GetTermsUseCase', { query })
    const result = await this.getTermsUseCase.execute(
      new GetTermsParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get terms', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('terms obtained', { data: result.data })
    return AppResult.success(result.data!.mapData((it) => TermOut.fromTerm(it)))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Term obtained successfully',
    model: TermOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Term cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getTermById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<TermOut>> {
    this.logger.debug('delegating get term by id to GetTermByIdUseCase', { id })
    const result = await this.getTermByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get term by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('term obtained', { data: result.data })
    return AppResult.success(TermOut.fromTerm(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Term updated successfully',
    model: TermOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Term or academic year cannot be found',
  })
  @ApiFailedResponse({
    status: 409,
    description:
      'Term name already exists in this academic year, overlaps with an existing term, an active term already exists, or academic year is not active',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(TermPolicy, 'update')
  @Put(':id')
  async updateTerm(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateTermDTO,
  ): Promise<AppResult<TermOut>> {
    this.logger.debug('delegating update term to UpdateTermUseCase', {
      id,
      body,
    })
    const result = await this.updateTermUseCase.execute(
      new UpdateTermParams({
        id,
        academicYearId: body.academicYearId,
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status,
      }),
    )
    if (result.exception) {
      this.logger.debug('update term failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('term updated', { data: result.data })
    return AppResult.success(TermOut.fromTerm(result.data!))
  }

  @ApiNoContentResponse({ description: 'Term successfully deleted' })
  @RequiredPermisson(TermPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteTerm(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete term to DeleteTermUseCase', { id })
    const result = await this.deleteTermUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete term', { error: result.exception })
      return result
    }
    this.logger.debug('term deleted')
  }
}
