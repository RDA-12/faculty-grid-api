/**
 * Base response data
 */
export abstract class AppResponse<_> {
  constructor(
    /** http status code of this reponse */
    readonly status: number,
  ) {}
}

/**
 * Response data when response is success
 */
export class SuccessResponse<T> extends AppResponse<T> {
  constructor(
    status: number,
    /** data that will be returned to client */
    readonly data: T | null,
  ) {
    super(status)
  }
}

export class FailedResponse<T> extends AppResponse<T> {
  constructor(
    status: number,
    /** short human-readable summary of the failure */
    readonly title: string,
    /** human-readable explanation of the failure */
    readonly detail: string,
  ) {
    super(status)
  }
}
