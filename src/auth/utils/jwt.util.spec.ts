import {
  AuthenticationModule,
  IssuedTokens,
  TokenService,
} from '@nestjs/authentication'
import { JWT } from './jwt.util.js'
import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import { AppException } from '../../common/app-exception.js'

describe('JWT', () => {
  const issuedToken: IssuedTokens = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 10,
  }
  const userToken = new UserToken(issuedToken)
  let nestTokenService: TokenService
  let jwt: JWT

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthenticationModule.forRoot()],
      providers: [],
    }).compile()

    nestTokenService = moduleRef.get(TokenService)
    jwt = new JWT(nestTokenService)
  })

  it('should returns success with correct token when TokenService.issue success', async () => {
    vi.spyOn(nestTokenService, 'issue').mockResolvedValue(issuedToken)
    const result = await jwt.issue('userId')

    expect(result).toStrictEqual(AppResult.success(userToken))
    expect(nestTokenService.issue).toHaveBeenCalledExactlyOnceWith('userId', {
      method: 'password',
    })
  })

  it('should returns failedwhen TokenService.issue failed', async () => {
    vi.spyOn(nestTokenService, 'issue').mockRejectedValue(new Error('error'))
    const result = await jwt.issue('userId')

    expect(result).toStrictEqual(
      AppResult.failed(new AppException('Error: error')),
    )
  })
})
