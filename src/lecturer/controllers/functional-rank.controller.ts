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
import { FunctionalRankPolicy } from '../policies/functional-rank.policy.js'
import {
  CreateFunctionalRankParams,
  CreateFunctionalRankUseCase,
} from '../use-cases/create-functional-rank.use-case.js'
import {
  GetFunctionalRanksParams,
  GetFunctionalRanksUseCase,
} from '../use-cases/get-functional-ranks.use-case.js'
import { GetFunctionalRankByIdUseCase } from '../use-cases/get-functional-rank-by-id.use-case.js'
import {
  UpdateFunctionalRankParams,
  UpdateFunctionalRankUseCase,
} from '../use-cases/update-functional-rank.use-case.js'
import { DeleteFunctionalRankUseCase } from '../use-cases/delete-functional-rank.use-case.js'
import {
  CreateFunctionalRankDTO,
  FunctionalRankOut,
  FunctionalRanksQuery,
  UpdateFunctionalRankDTO,
} from './functional-rank.dto.js'

@Controller('functional-ranks')
export class FunctionalRankController {
  constructor(
    private readonly createFunctionalRankUseCase: CreateFunctionalRankUseCase,
    private readonly getFunctionalRanksUseCase: GetFunctionalRanksUseCase,
    private readonly getFunctionalRankByIdUseCase: GetFunctionalRankByIdUseCase,
    private readonly updateFunctionalRankUseCase: UpdateFunctionalRankUseCase,
    private readonly deleteFunctionalRankUseCase: DeleteFunctionalRankUseCase,
  ) {
    this.logger = new Logger('FunctionalRankController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Functional rank created successfully',
    model: FunctionalRankOut,
  })
  @ApiFailedResponse({
    status: 409,
    description: 'Functional rank with the same name already exists',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(FunctionalRankPolicy, 'create')
  @Post()
  async createFunctionalRank(
    @CurrentUser() user: User,
    @Body() body: CreateFunctionalRankDTO,
  ): Promise<AppResult<FunctionalRankOut>> {
    this.logger.debug(
      'delegating create new functional rank to CreateFunctionalRankUseCase',
      { body },
    )
    const result = await this.createFunctionalRankUseCase.execute(
      new CreateFunctionalRankParams({
        name: body.name,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create functional rank failed', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('functional rank created', { data: result.data })
    return AppResult.success(FunctionalRankOut.fromFunctionalRank(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Functional ranks obtained successfully',
    model: FunctionalRankOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getFunctionalRanks(
    @CurrentUser() _user: User,
    @Query() query?: FunctionalRanksQuery,
  ): Promise<AppResult<PaginatedResult<FunctionalRankOut>>> {
    this.logger.debug(
      'delegating get functional ranks to GetFunctionalRanksUseCase',
      { query },
    )
    const result = await this.getFunctionalRanksUseCase.execute(
      new GetFunctionalRanksParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get functional ranks', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('functional ranks obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => FunctionalRankOut.fromFunctionalRank(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Functional rank obtained successfully',
    model: FunctionalRankOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Functional rank cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getFunctionalRankById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<FunctionalRankOut>> {
    this.logger.debug(
      'delegating get functional rank by id to GetFunctionalRankByIdUseCase',
      { id },
    )
    const result = await this.getFunctionalRankByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get functional rank by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('functional rank obtained', { data: result.data })
    return AppResult.success(FunctionalRankOut.fromFunctionalRank(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Functional rank updated successfully',
    model: FunctionalRankOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Functional rank cannot be found',
  })
  @ApiFailedResponse({
    status: 409,
    description: 'Functional rank with the same name already exists',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(FunctionalRankPolicy, 'update')
  @Put(':id')
  async updateFunctionalRank(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateFunctionalRankDTO,
  ): Promise<AppResult<FunctionalRankOut>> {
    this.logger.debug(
      'delegating update functional rank to UpdateFunctionalRankUseCase',
      { id, body },
    )
    const result = await this.updateFunctionalRankUseCase.execute(
      new UpdateFunctionalRankParams({
        id,
        name: body.name,
      }),
    )
    if (result.exception) {
      this.logger.debug('update functional rank failed', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('functional rank updated', { data: result.data })
    return AppResult.success(FunctionalRankOut.fromFunctionalRank(result.data!))
  }

  @ApiNoContentResponse({
    description: 'Functional rank successfully deleted',
  })
  @RequiredPermisson(FunctionalRankPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteFunctionalRank(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ) {
    this.logger.debug(
      'delegating delete functional rank to DeleteFunctionalRankUseCase',
      { id },
    )
    const result = await this.deleteFunctionalRankUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete functional rank', {
        error: result.exception,
      })
      return result
    }
    this.logger.debug('functional rank deleted')
  }
}
