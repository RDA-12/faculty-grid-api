import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { ApiKeyValidationPipe } from '../pipes/api-key-validation.pipe.js'

const ExtractApiKeyHeader = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.headers['x-api-key']
  },
)

export const ApiKeyHeader = () => ExtractApiKeyHeader(ApiKeyValidationPipe)
