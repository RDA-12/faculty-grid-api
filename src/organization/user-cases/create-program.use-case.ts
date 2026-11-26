import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'

/**
 * Params for CreateProgramUseCase
 */
export class CreateProgramParams {
  constructor({
    name,
    createdBy,
    degreeLevel,
    facultyId,
  }: Required<CreateProgramParams>) {
    this.name = name
    this.degreeLevel = degreeLevel
    this.facultyId = facultyId
    this.createdBy = createdBy
  }

  readonly name: string
  readonly degreeLevel: ProgramDegreeLevel
  readonly facultyId: string
  readonly createdBy: string
}

/**
 * Use case to create new faculty data
 */
@Injectable()
export class CreateProgramUseCase implements PromiseUseCase<
  CreateProgramParams,
  Program
> {
  constructor(private readonly programRepository: ProgramRepository) {
    this.logger = new Logger('CreateProgramUseCase')
  }

  private readonly logger: Logger

  execute(params: CreateProgramParams): Promise<AppResult<Program>> {
    this.logger.debug('delegating save new faculty to ProgramRepository', {
      params,
    })
    return this.programRepository.save(params)
  }
}
