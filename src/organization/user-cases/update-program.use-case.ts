import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'

/**
 * Params for UpdateProgramUseCase
 */
export class UpdateProgramParams {
  constructor({
    id,
    name,
    degreeLevel,
    facultyId,
  }: Required<UpdateProgramParams>) {
    this.id = id
    this.name = name
    this.degreeLevel = degreeLevel
    this.facultyId = facultyId
  }

  readonly id: string
  readonly name: string
  readonly degreeLevel: ProgramDegreeLevel
  readonly facultyId: string
}

/**
 * Use case to update an existing program
 */
@Injectable()
export class UpdateProgramUseCase implements PromiseUseCase<
  UpdateProgramParams,
  Program
> {
  constructor(private readonly programRepository: ProgramRepository) {
    this.logger = new Logger('UpdateProgramUseCase')
  }

  private readonly logger: Logger

  execute(params: UpdateProgramParams): Promise<AppResult<Program>> {
    this.logger.debug('delegating update program to ProgramRepository', {
      params,
    })
    return this.programRepository.update(params)
  }
}
