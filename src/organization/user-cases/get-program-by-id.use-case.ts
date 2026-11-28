import { Injectable, Logger } from '@nestjs/common'
import type { PromiseUseCase } from '../../common/base-use-case.js'
import type { AppResult } from '../../common/app-result.js'
import type { Program } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'

/**
 * Use case to get a single program by ID
 */
@Injectable()
export class GetProgramByIdUseCase implements PromiseUseCase<string, Program> {
  constructor(private readonly programRepository: ProgramRepository) {
    this.logger = new Logger('GetProgramByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<Program>> {
    this.logger.debug('delegating get program by id to ProgramRepository', {
      params,
    })
    return this.programRepository.getById(params)
  }
}
