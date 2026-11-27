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
import { TitlePolicy } from '../policies/title.policy.js'
import {
  CreateTitleParams,
  CreateTitleUseCase,
} from '../user-cases/create-title.use-case.js'
import {
  GetTitlesParams,
  GetTitlesUseCase,
} from '../user-cases/get-titles.use-case.js'
import { GetTitleByIdUseCase } from '../user-cases/get-title-by-id.use-case.js'
import {
  UpdateTitleParams,
  UpdateTitleUseCase,
} from '../user-cases/update-title.use-case.js'
import { DeleteTitleUseCase } from '../user-cases/delete-title.use-case.js'
import {
  CreateTitleDTO,
  TitleOut,
  TitlesQuery,
  UpdateTitleDTO,
} from './title.dto.js'

@Controller('titles')
export class TitleController {
  constructor(
    private readonly createTitleUseCase: CreateTitleUseCase,
    private readonly getTitlesUseCase: GetTitlesUseCase,
    private readonly getTitleByIdUseCase: GetTitleByIdUseCase,
    private readonly updateTitleUseCase: UpdateTitleUseCase,
    private readonly deleteTitleUseCase: DeleteTitleUseCase,
  ) {
    this.logger = new Logger('TitleController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Title created successfully',
    model: TitleOut,
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(TitlePolicy, 'create')
  @Post()
  async createTitle(
    @CurrentUser() user: User,
    @Body() body: CreateTitleDTO,
  ): Promise<AppResult<TitleOut>> {
    this.logger.debug('delegating create new title to CreateTitleUseCase', {
      body,
    })
    const result = await this.createTitleUseCase.execute(
      new CreateTitleParams({
        name: body.name,
        scope: body.scope,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create title failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('title created', { data: result.data })
    return AppResult.success(TitleOut.fromTitle(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Titles obtained successfully',
    model: TitleOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getTitles(
    @CurrentUser() _user: User,
    @Query() query?: TitlesQuery,
  ): Promise<AppResult<PaginatedResult<TitleOut>>> {
    this.logger.debug('delegating get titles to GetTitlesUseCase', {
      query,
    })
    const result = await this.getTitlesUseCase.execute(
      new GetTitlesParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get titles', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('titles obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => TitleOut.fromTitle(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Title obtained successfully',
    model: TitleOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Title cannot be found',
  })
  @Anyone()
  @Get(':id')
  async getTitleById(
    @CurrentUser() _user: User,
    @Param('id') id: string,
  ): Promise<AppResult<TitleOut>> {
    this.logger.debug('delegating get title by id to GetTitleByIdUseCase', {
      id,
    })
    const result = await this.getTitleByIdUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to get title by id', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('title obtained', { data: result.data })
    return AppResult.success(TitleOut.fromTitle(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Title updated successfully',
    model: TitleOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Title cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(TitlePolicy, 'update')
  @Put(':id')
  async updateTitle(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateTitleDTO,
  ): Promise<AppResult<TitleOut>> {
    this.logger.debug('delegating update title to UpdateTitleUseCase', {
      id,
      body,
    })
    const result = await this.updateTitleUseCase.execute(
      new UpdateTitleParams({
        id,
        name: body.name,
        scope: body.scope,
      }),
    )
    if (result.exception) {
      this.logger.debug('update title failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('title updated', { data: result.data })
    return AppResult.success(TitleOut.fromTitle(result.data!))
  }

  @ApiNoContentResponse({ description: 'Title successfully deleted' })
  @RequiredPermisson(TitlePolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteTitle(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete title to DeleteTitleUseCase', {
      id,
    })
    const result = await this.deleteTitleUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete title', { error: result.exception })
      return result
    }
    this.logger.debug('title deleted')
  }
}
