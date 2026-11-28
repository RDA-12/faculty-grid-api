import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import type { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import { GetLecturerByIdUseCase } from '../../lecturer/use-cases/get-lecturer-by-id.use-case.js'
import { GetTitleByIdUseCase } from '../../organization/user-cases/get-title-by-id.use-case.js'
import { validateLecturerTitleAssignment } from './lecturer-title-validation.helper.js'

type CreateLecturerTitleParamsArgs = {
  lecturerId: string
  titleId: string
  facultyId?: string | null
  programId?: string | null
  startDate: string
  endDate?: string | null
  createdBy: string
}

/**
 * Params for CreateLecturerTitleUseCase
 */
export class CreateLecturerTitleParams {
  constructor({
    lecturerId,
    titleId,
    facultyId = null,
    programId = null,
    startDate,
    endDate = null,
    createdBy,
  }: CreateLecturerTitleParamsArgs) {
    this.lecturerId = lecturerId
    this.titleId = titleId
    this.facultyId = facultyId ?? null
    this.programId = programId ?? null
    this.startDate = startDate
    this.endDate = endDate ?? null
    this.createdBy = createdBy
  }

  readonly lecturerId: string
  readonly titleId: string
  readonly facultyId: string | null
  readonly programId: string | null
  readonly startDate: string
  readonly endDate: string | null
  readonly createdBy: string
}

/**
 * Use case to assign a structural title to a lecturer (rotating any active holder)
 */
@Injectable()
export class CreateLecturerTitleUseCase implements PromiseUseCase<
  CreateLecturerTitleParams,
  LecturerTitle
> {
  constructor(
    private readonly lecturerTitleRepository: LecturerTitleRepository,
    private readonly getLecturerByIdUseCase: GetLecturerByIdUseCase,
    private readonly getTitleByIdUseCase: GetTitleByIdUseCase,
  ) {
    this.logger = new Logger('CreateLecturerTitleUseCase')
  }

  private readonly logger: Logger

  async execute(
    params: CreateLecturerTitleParams,
  ): Promise<AppResult<LecturerTitle>> {
    this.logger.debug('validating lecturer title assignment', { params })
    const validation = await validateLecturerTitleAssignment(
      params,
      this.getLecturerByIdUseCase,
      this.getTitleByIdUseCase,
    )
    if (validation.exception) {
      return AppResult.failed(validation.exception)
    }

    this.logger.debug(
      'delegating save new lecturer title to LecturerTitleRepository',
      { params },
    )
    return this.lecturerTitleRepository.save(params)
  }
}
