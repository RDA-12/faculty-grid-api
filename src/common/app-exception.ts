import { ValidationError } from '@nestjs/common'

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

/**
 * Represent single property error
 */
export class InvalidRequestError {
  constructor({ property, value, constraints }: Required<InvalidRequestError>) {
    this.property = property
    this.value = value
    this.constraints = constraints
  }

  /** property name that has error */
  readonly property: string

  /** current invalid value */
  readonly value: any

  /** list of constraints violated by current value */
  readonly constraints: string[]
}

/**
 * Exception for invalid request body from client
 *
 * Typically returned by ValidationPipe
 */
export class InvalidRequestException extends AppException {
  constructor(errors: InvalidRequestError[]) {
    super({
      status: 422,
      title: 'Invalid request body',
      detail: 'There are invalid property on the body. See errors for detail',
    })
    this.errors = errors
  }

  readonly errors: InvalidRequestError[]

  static fromValidationPipe(errors: ValidationError[]) {
    function populateError(
      error: ValidationError,
      parentPath = '',
    ): InvalidRequestError[] {
      // Build dot-notated property path: e.g. "address.street" or "items.0.name"
      const currentPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property
      const result: InvalidRequestError[] = []

      // Only add an error if this field has actual constraint violations
      if (error.constraints && Object.keys(error.constraints).length > 0) {
        result.push(
          new InvalidRequestError({
            property: currentPath,
            value: error.value,
            constraints: Object.values(error.constraints),
          }),
        )
      }

      // Recursively collect errors from children
      if (error.children?.length) {
        for (const child of error.children) {
          result.push(...populateError(child, currentPath))
        }
      }

      return result
    }

    const effectiveErrors = errors.flatMap((err) => populateError(err))
    return new InvalidRequestException(effectiveErrors)
  }
}
