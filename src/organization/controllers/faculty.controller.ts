import { Body, Controller, Logger, Post } from '@nestjs/common'
import {
  CreateFacultyParams,
  CreateFacultyUseCase,
} from '../user-cases/create-faculty.use-case.js'
import { CreateFacultyDTO, FacultyOut } from './faculty.dto.js'
import { AppResult } from '../../common/app-result.js'
import { CurrentUser } from '@nestjs/authentication'
import { User } from '../../user/entities/user.entity.js'
import {
  ApiInvalidRequestResponse,
  ApiSuccessResponse,
} from '../../common/app-response.js'
import { RequiredPermisson } from '../../authz/decorators/required-permission.decorator.js'
import { FacultyPolicy } from '../policies/faculty.policy.js'

@Controller('faculties')
export class FacultyController {
  constructor(private readonly createFacultyUseCase: CreateFacultyUseCase) {
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
}
