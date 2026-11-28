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
import { User } from '../../user/entities/user.entity.js'
import {
  CreateProgramDTO,
  ProgramOut,
  ProgramsQuery,
  UpdateProgramDTO,
} from './program.dto.js'
import { RequiredPermisson } from '../../authz/decorators/required-permission.decorator.js'
import {
  ApiFailedResponse,
  ApiInvalidRequestResponse,
  ApiSuccessResponse,
} from '../../common/app-response.js'
import {
  CreateProgramParams,
  CreateProgramUseCase,
} from '../user-cases/create-program.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { ProgramPolicy } from '../policies/program.policy.js'
import { Anyone } from '../../authz/decorators/anyone.decorator.js'
import { PaginatedResult } from '../../common/pagination.js'
import {
  GetProgramsParams,
  GetProgramsUseCase,
} from '../user-cases/get-programs.use-case.js'
import {
  UpdateProgramParams,
  UpdateProgramUseCase,
} from '../user-cases/update-program.use-case.js'
import { ApiNoContentResponse } from '@nestjs/swagger'
import { DeleteProgramUseCase } from '../user-cases/delete-program.use-case.js'

@Controller('programs')
export class ProgramController {
  constructor(
    private readonly createProgramUseCase: CreateProgramUseCase,
    private readonly getProgramsUseCase: GetProgramsUseCase,
    private readonly updateProgramUseCase: UpdateProgramUseCase,
    private readonly deleteProgramUseCase: DeleteProgramUseCase,
  ) {
    this.logger = new Logger('ProgramController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 201,
    description: 'Program created successfully',
    model: ProgramOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Program cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(ProgramPolicy, 'create')
  @Post()
  async createProgram(
    @CurrentUser() user: User,
    @Body() body: CreateProgramDTO,
  ): Promise<AppResult<ProgramOut>> {
    this.logger.debug('delegating create new program to CreateProgramRequest', {
      body,
    })
    const result = await this.createProgramUseCase.execute(
      new CreateProgramParams({
        name: body.name,
        degreeLevel: body.degreeLevel,
        facultyId: body.facultyId,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create program failed', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('program created', { data: result.data })
    return AppResult.success(ProgramOut.fromProgram(result.data!))
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Programs obtained successfully',
    model: ProgramOut,
    isArray: true,
  })
  @Anyone()
  @Get()
  async getPrograms(
    @CurrentUser() _user: User,
    @Query() query?: ProgramsQuery,
  ): Promise<AppResult<PaginatedResult<ProgramOut>>> {
    this.logger.debug('delegating get programs to GetProgramsUseCase', {
      query,
    })
    const result = await this.getProgramsUseCase.execute(
      new GetProgramsParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get programs', { error: result.exception })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('programs obtained', { data: result.data })
    return AppResult.success(
      result.data!.mapData((it) => ProgramOut.fromProgram(it)),
    )
  }

  @ApiSuccessResponse({
    status: 200,
    description: 'Program updated successfully',
    model: ProgramOut,
  })
  @ApiFailedResponse({
    status: 404,
    description: 'Program or faculty cannot be found',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid data in the body',
  })
  @RequiredPermisson(ProgramPolicy, 'update')
  @Put(':id')
  async updateProgram(
    @CurrentUser() _user: User,
    @Param('id') id: string,
    @Body() body: UpdateProgramDTO,
  ): Promise<AppResult<ProgramOut>> {
    this.logger.debug('delegating update program to UpdateProgramUseCase', {
      id,
      body,
    })
    const result = await this.updateProgramUseCase.execute(
      new UpdateProgramParams({
        id,
        name: body.name,
        degreeLevel: body.degreeLevel,
        facultyId: body.facultyId,
      }),
    )
    if (result.exception) {
      this.logger.debug('failed to update program', {
        error: result.exception,
      })
      return AppResult.failed(result.exception)
    }
    this.logger.debug('program updated', { data: result.data })
    return AppResult.success(ProgramOut.fromProgram(result.data!))
  }

  @ApiNoContentResponse({ description: 'Program successfully deleted' })
  @RequiredPermisson(ProgramPolicy, 'delete')
  @Delete(':id')
  @HttpCode(204)
  async deleteProgram(@CurrentUser() _user: User, @Param('id') id: string) {
    this.logger.debug('delegating delete program to DeleteProgramUseCase', {
      id,
    })
    const result = await this.deleteProgramUseCase.execute(id)
    if (result.exception) {
      this.logger.debug('failed to delete program', { error: result.exception })
      return result
    }
    this.logger.debug('program deleted')
  }
}
