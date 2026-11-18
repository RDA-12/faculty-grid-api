import { AppException } from './app-exception.js'

type Result<T> = AppResultSuccess<T> | AppResultFailed

export class AppResult<T> {
  constructor(private readonly result: Result<T>) {}

  static success<T>(data: T): AppResult<T> {
    let result = new AppResultSuccess(data)
    return new AppResult<T>(result)
  }

  static failed<T>(exception: AppException): AppResult<T> {
    let result = new AppResultFailed(exception)
    return new AppResult<T>(result)
  }

  /**
   * Return T data if this result is success. Otherwise, null
   */
  get data(): T | null {
    if (this.result instanceof AppResultSuccess) {
      return this.result.data
    }
    return null
  }

  /**
   * Return AppException if this result is failed. Otherwise, null
   */
  get exception(): AppException | null {
    if (this.result instanceof AppResultFailed) {
      return this.result.exception
    }
    return null
  }
}

class AppResultSuccess<T> {
  readonly data: T

  constructor(data: T) {
    this.data = data
  }
}

class AppResultFailed {
  readonly exception: AppException

  constructor(exception: AppException) {
    this.exception = exception
  }
}
