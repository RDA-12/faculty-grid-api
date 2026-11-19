import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SecretConfig } from '../config.js'

/**
 * Ensure provided x-api-key header is correct
 *
 * Throw UnauthorizedException from nestjs with errorCode 'missing_api_key' when header is missing
 * and 'invalid_api_key' when api key is invalid
 */
@Injectable()
export class ApiKeyValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(value: any, { type }: ArgumentMetadata) {
    if (!value) {
      throw new UnauthorizedException(null, {
        errorCode: 'missing_api_key',
      })
    }

    if (typeof value !== 'string' || type !== 'custom') {
      throw new UnauthorizedException(null, {
        errorCode: 'invalid_api_key',
      })
    }

    const config = this.configService.get<SecretConfig>('secret')!
    if (value !== config.api) {
      throw new UnauthorizedException(null, {
        errorCode: 'invalid_api_key',
      })
    }

    return value
  }
}
