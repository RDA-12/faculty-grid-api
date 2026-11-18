import { applyDecorators, Type } from '@nestjs/common'
import {
  ApiExtraModels,
  ApiProperty,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger'

/**
 * Base response data
 */
export abstract class AppResponse<_> {
  constructor(status: number) {
    this.status = status
  }

  @ApiProperty({ description: 'HTTP status code' })
  readonly status: number
}

/**
 * Response data when response is success
 */
export class SuccessResponse<T> extends AppResponse<T> {
  constructor(status: number, data: T | null) {
    super(status)
    this.data = data
  }

  /** data that will be returned to client */
  @ApiProperty()
  readonly data: T | null
}

export class FailedResponse<T> extends AppResponse<T> {
  constructor(status: number, title: string, detail: string) {
    super(status)
    this.title = title
    this.detail = detail
  }

  /** short human-readable summary of the failure */
  @ApiProperty({ description: 'short human-readable summary of the failure' })
  readonly title: string

  /** human-readable explanation of the failure */
  @ApiProperty({ description: 'human-readable explantion of the failure' })
  readonly detail: string
}

type BaseResponseArgs = {
  status: number
  description: string
}

type ApiSuccessResponseArgs<TModel> = {
  model: TModel
} & BaseResponseArgs

/** Respose decorator for swagger API Success */
export const ApiSuccessResponse = <TModel extends Type<any>>({
  status,
  model,
  description,
}: ApiSuccessResponseArgs<TModel>) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: status,
      description: description,
      schema: {
        title: `SuccessResponseOf${model.name}`,
        allOf: [
          { $ref: getSchemaPath(SuccessResponse) },
          {
            properties: {
              status: {
                example: status,
              },
              data: {
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  )
}

/** Respose decorator for swagger API Success */
export const ApiFailedResponse = ({
  status,
  description,
}: BaseResponseArgs) => {
  return applyDecorators(
    ApiExtraModels(FailedResponse),
    ApiResponse({
      status: status,
      description: description,
      schema: {
        allOf: [{ $ref: getSchemaPath(FailedResponse) }],
        properties: {
          status: {
            example: status,
          },
        },
      },
    }),
  )
}
