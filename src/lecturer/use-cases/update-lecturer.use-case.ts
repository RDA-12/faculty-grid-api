import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicDegree,
  EmploymentStatus,
  type Lecturer,
} from '../entities/lecturer.entity.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import { RankRepository } from '../repositories/rank.repository.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import { validateLecturerReferences } from './lecturer-validation.helper.js'

type UpdateLecturerParamsArgs = {
  id: string
  name: string
  displayName: string
  programId: string
  employmentStatus: EmploymentStatus
  rankId?: string | null
  functionalRankId?: string | null
  academicDegree: AcademicDegree
}

/**
 * Params for UpdateLecturerUseCase
 */
export class UpdateLecturerParams {
  constructor({
    id,
    name,
    displayName,
    programId,
    employmentStatus,
    rankId = null,
    functionalRankId = null,
    academicDegree,
  }: UpdateLecturerParamsArgs) {
    this.id = id
    this.name = name
    this.displayName = displayName
    this.programId = programId
    this.employmentStatus = employmentStatus
    this.rankId = rankId ?? null
    this.functionalRankId = functionalRankId ?? null
    this.academicDegree = academicDegree
  }

  readonly id: string
  readonly name: string
  readonly displayName: string
  readonly programId: string
  readonly employmentStatus: EmploymentStatus
  readonly rankId: string | null
  readonly functionalRankId: string | null
  readonly academicDegree: AcademicDegree
}

/**
 * Use case to update an existing lecturer profile
 */
@Injectable()
export class UpdateLecturerUseCase implements PromiseUseCase<
  UpdateLecturerParams,
  Lecturer
> {
  constructor(
    private readonly lecturerRepository: LecturerRepository,
    private readonly rankRepository: RankRepository,
    private readonly functionalRankRepository: FunctionalRankRepository,
  ) {
    this.logger = new Logger('UpdateLecturerUseCase')
  }

  private readonly logger: Logger

  async execute(params: UpdateLecturerParams): Promise<AppResult<Lecturer>> {
    this.logger.debug('validating lecturer references', { params })
    const validation = await validateLecturerReferences(
      params,
      this.rankRepository,
      this.functionalRankRepository,
    )
    if (validation.exception) {
      return AppResult.failed(validation.exception)
    }

    this.logger.debug('delegating update lecturer to LecturerRepository', {
      params,
    })
    return this.lecturerRepository.update(params)
  }
}
