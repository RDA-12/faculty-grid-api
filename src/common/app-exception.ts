export class AppException extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class InvalidCredentialException extends AppException {
  constructor() {
    super('invalid credential')
  }
}
