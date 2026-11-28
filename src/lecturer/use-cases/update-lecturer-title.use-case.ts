import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import type { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import { GetTitleByIdUseCase } from '../../organization/user-cases/get-title-by-id.use-case.js'
import { validateLecturerTitleAssignment } from './lecturer-title-validation.helper.js'

type UpdateLecturerTitleParamsArgs = {
  id: string
  lecturerId: string
  titleId: string
  facultyId?: string | null
  programId?: string | null
  startDate: string
  endDate?: string | null
}

/**
 * Params for UpdateLecturerTitleUseCase
 */
export class UpdateLecturerTitleParams {
  constructor({
    id,
    lecturerId,
    titleId,
    facultyId = null,
    programId = null,
    startDate,
    endDate = null,
  }: UpdateLecturerTitleParamsArgs) {
    this.id = id
    this.lecturerId = lecturerId
    this.titleId = titleId
    this.facultyId = facultyId ?? null
    this.programId = programId ?? null
    this.startDate = startDate
    this.endDate = endDate ?? null
  }

  readonly id: string
  readonly lecturerId: string
  readonly titleId: string
  readonly facultyId: string | null
  readonly programId: string | null
  readonly startDate: string
  readonly endDate: string | null
}

/**
 * Use case to update an existing lecturer title assignment
 */
@Injectable()
export class UpdateLecturerTitleUseCase implements PromiseUseCase<
  UpdateLecturerTitleParams,
  LecturerTitle
> {
  constructor(
    private readonly lecturerTitleRepository: LecturerTitleRepository,
    private readonly lecturerRepository: LecturerRepository,
    private readonly getTitleByIdUseCase: GetTitleByIdUseCase,
  ) {
    this.logger = new Logger('UpdateLecturerTitleUseCase')
  }

  private readonly logger: Logger

  async execute(
    params: UpdateLecturerTitleParams,
  ): Promise<AppResult<LecturerTitle>> {
    this.logger.debug('validating lecturer title update', { params })
    const validation = await validateLecturerTitleAssignment(
      params,
      this.lecturerRepository,
      this.getTitleByIdUseCase,
    )
    if (validation.exception) {
      return AppResult.failed(validation.exception)
    }

    this.logger.debug(
      'delegating update lecturer title to LecturerTitleRepository',
      { params },
    )
    return this.lecturerTitleRepository.update(params)
  }
}
