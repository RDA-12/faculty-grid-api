type AppExceptionConstructor = {
  status: number
  title: string
  detail: string
}

export class AppException extends Error {
  constructor({ status, title, detail }: AppExceptionConstructor) {
    super(detail)
    this.status = status
    this.title = title
    this.detail = detail
  }

  /** HTTP status code for this exception */
  readonly status: number
  /** short human-readable summary of this exception */
  readonly title: string
  /** human-readable explanation of this exception */
  readonly detail: string
}

export class InvalidCredentialException extends AppException {
  constructor() {
    super({
      status: 401,
      title: 'Provided credential is invalid',
      detail: 'Email/password/both is invalid. Please check again',
    })
  }
}
