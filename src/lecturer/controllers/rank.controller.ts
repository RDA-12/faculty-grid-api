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
import { RankPolicy } from '../policies/rank.policy.js'
import {
  CreateRankParams,
  CreateRankUseCase,
} from '../use-cases/create-rank.use-case.js'
import {
  GetRanksParams,
  GetRanksUseCase,
} from '../use-cases/get-ranks.use-case.js'
import { GetRankByIdUseCase } from '../use-cases/get-rank-by-id.use-case.js'
import {
  UpdateRankParams,
  UpdateRankUseCase,
} from '../use-cases/update-rank.use-case.js'
import { DeleteRankUseCase } from '../use-cases/delete-rank.use-case.js'
import {
  CreateRankDTO,
  RankOut,
  RanksQuery,
  UpdateRankDTO,
} from './rank.dto.js'

@Controller('ranks')
export class RankController {
  constructor(
    private readonly createRankUseCase: CreateRankUseCase,
    private readonly getRanksUseCase: GetRanksUseCase,
    private readonly getRankByIdUseCase: GetRankByIdUseCase,
    private readonly updateRankUseCase: UpdateRankUseCase,
    private readonly deleteRankUseCase: DeleteRankUseCase,
  ) {
    this.logger = new Logger('RankController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Rank created successfully',
    model: RankOut,
  })
  @ApiFailedResponse({
    status: 409,
    description: 'Rank with the same name and type already exists',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(RankPolicy, 'create')
  @Post()
  async createRank(
    @CurrentUser() user: User,
    @Body() body: CreateRankDTO,
  ): Promise<AppResult<RankOut>> {
    this.logger.debug('delegating create new rank to CreateRankUseCase', {
      body,
    })
    const result = await this.createRankUseCase.execute(
      new CreateRankParams({
        name: body.name,
        type: body.type,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create rank failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('rank created', { data: result.data })
    return AppResult.success(RankOut.fromRank(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Ranks obtained successfully',
    model: RankOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getRanks(
    @CurrentUser() _user: User,
    @Query() query?: RanksQuery,
  ): Promise<AppResult<PaginatedResult<RankOut>>> {
    this.logger.debug('delegating get ranks to GetRanksUseCase', {
      query,
    })
    const result = await this.getRanksUseCase.execute(
      new GetRanksParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get ranks', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('ranks obtained', { data: result.data })
    return AppResult.success(result.data!.mapData((it) => RankOut.fromRank(it)))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Rank obtained successfully',
    model: RankOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Rank cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getRankById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<RankOut>> {
    this.logger.debug('delegating get rank by id to GetRankByIdUseCase', {
      id,
    })
    const result = await this.getRankByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get rank by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('rank obtained', { data: result.data })
    return AppResult.success(RankOut.fromRank(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Rank updated successfully',
    model: RankOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Rank cannot be found',
  })
  @ApiFailedResponse({
    status: 409,
    description: 'Rank with the same name and type already exists',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(RankPolicy, 'update')
  @Put(':id')
  async updateRank(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateRankDTO,
  ): Promise<AppResult<RankOut>> {
    this.logger.debug('delegating update rank to UpdateRankUseCase', {
      id,
      body,
    })
    const result = await this.updateRankUseCase.execute(
      new UpdateRankParams({
        id,
        name: body.name,
        type: body.type,
      }),
    )
    if (result.exception) {
      this.logger.debug('update rank failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('rank updated', { data: result.data })
    return AppResult.success(RankOut.fromRank(result.data!))
  }

  @ApiNoContentResponse({ description: 'Rank successfully deleted' })
  @RequiredPermisson(RankPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteRank(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete rank to DeleteRankUseCase', {
      id,
    })
    const result = await this.deleteRankUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete rank', { error: result.exception })
      return result
    }
    this.logger.debug('rank deleted')
  }
}
