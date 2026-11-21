import { CurrentUser } from '@nestjs/authentication'
import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common'
import { User } from '../../user/entities/user.entity.js'
import { CreateProgramDTO, ProgramOut, ProgramsQuery } from './program.dto.js'
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

@Controller('programs')
export class ProgramController {
  constructor(
    private readonly createProgramUseCase: CreateProgramUseCase,
    private readonly getProgramsUseCase: GetProgramsUseCase,
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
    this.logger.debug('delegating create new program to CreateProgramRequest')
    const result = await this.createProgramUseCase.execute(
      new CreateProgramParams({
        name: body.name,
        degreeLevel: body.degreeLevel,
        facultyId: body.facultyId,
        createdBy: user.id,
      }),
    )
    if (result.exception) {
      this.logger.debug('create program failed')
      return AppResult.failed(result.exception)
    }
    this.logger.debug('program created')
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
    this.logger.debug('delegating get programs to GetProgramsUseCase')
    const result = await this.getProgramsUseCase.execute(
      new GetProgramsParams(query ?? {}),
    )
    if (result.exception) {
      this.logger.debug('failed to get programs')
      return AppResult.failed(result.exception)
    }
    this.logger.debug('programs obtained')
    return AppResult.success(
      result.data!.mapData((it) => ProgramOut.fromProgram(it)),
    )
  }
}
