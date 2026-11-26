import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { AppResult } from '../../common/app-result.js'
import { ProgramRepository } from '../repositories/program.repository.js'

/**
 * Use case to delete a Program
 */
@Injectable()
export class DeleteProgramUseCase implements PromiseUseCase<string, null> {
  constructor(private readonly programRepository: ProgramRepository) {
    this.logger = new Logger('DeleteProgramUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<null>> {
    this.logger.debug('delegating deleting a faculty to ProgramRepository', {
      params,
    })
    return this.programRepository.deleteById(params)
  }
}
