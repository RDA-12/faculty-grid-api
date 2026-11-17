import { AppException } from './app-exception.js'

type Result<T> = AppResultSuccess<T> | AppResultFailed
type OnAppResultWhen<T> = {
  success?: (data: T) => void
  failed?: (exception: AppException) => void
}

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

  when({ success, failed }: OnAppResultWhen<T>) {
    if (this.result instanceof AppResultSuccess && success) {
      success(this.result.data)
    }
    if (this.result instanceof AppResultFailed && failed) {
      failed(this.result.exception)
    }
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
