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

type CreateLecturerParamsArgs = {
  name: string
  displayName: string
  programId: string
  employmentStatus: EmploymentStatus
  rankId?: string | null
  functionalRankId?: string | null
  academicDegree: AcademicDegree
  createdBy: string
}

/**
 * Params for CreateLecturerUseCase
 */
export class CreateLecturerParams {
  constructor({
    name,
    displayName,
    programId,
    employmentStatus,
    rankId = null,
    functionalRankId = null,
    academicDegree,
    createdBy,
  }: CreateLecturerParamsArgs) {
    this.name = name
    this.displayName = displayName
    this.programId = programId
    this.employmentStatus = employmentStatus
    this.rankId = rankId ?? null
    this.functionalRankId = functionalRankId ?? null
    this.academicDegree = academicDegree
    this.createdBy = createdBy
  }

  readonly name: string
  readonly displayName: string
  readonly programId: string
  readonly employmentStatus: EmploymentStatus
  readonly rankId: string | null
  readonly functionalRankId: string | null
  readonly academicDegree: AcademicDegree
  readonly createdBy: string
}

/**
 * Use case to create a new lecturer profile
 */
@Injectable()
export class CreateLecturerUseCase implements PromiseUseCase<
  CreateLecturerParams,
  Lecturer
> {
  constructor(
    private readonly lecturerRepository: LecturerRepository,
    private readonly rankRepository: RankRepository,
    private readonly functionalRankRepository: FunctionalRankRepository,
  ) {
    this.logger = new Logger('CreateLecturerUseCase')
  }

  private readonly logger: Logger

  async execute(params: CreateLecturerParams): Promise<AppResult<Lecturer>> {
    this.logger.debug('validating lecturer references', { params })
    const validation = await validateLecturerReferences(
      params,
      this.rankRepository,
      this.functionalRankRepository,
    )
    if (validation.exception) {
      return AppResult.failed(validation.exception)
    }

    this.logger.debug('delegating save new lecturer to LecturerRepository', {
      params,
    })
    return this.lecturerRepository.save(params)
  }
}
