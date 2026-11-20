import { AppResult } from './app-result.js'

/**
 * Interface that needs to be implemented for every
 * use case returned a Promise
 *
 * [P] is params need to be supplied by its callers.
 *
 * [R] is return type by the use case
 */
export interface PromiseUseCase<P, R> {
  /**
   * execute this use case
   */
  execute(params: P): Promise<AppResult<R>>
}

export interface NoParamPromiseUseCase<R> {
  /**
   * execute this use case
   */
  execute(): Promise<AppResult<R>>
}
