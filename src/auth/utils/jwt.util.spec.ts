import { IssuedTokens, TokenService } from '@nestjs/authentication'
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
  let nestTokenService: { issue: ReturnType<typeof vi.fn> }
  let jwt: JWT

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TokenService,
          useValue: {
            issue: vi.fn().mockResolvedValue(issuedToken),
          },
        },
        JWT,
      ],
    }).compile()

    nestTokenService = moduleRef.get(TokenService)
    jwt = moduleRef.get(JWT)
  })

  it('should returns success with correct token when TokenService.issue success', async () => {
    const result = await jwt.issue('userId')

    expect(result).toStrictEqual(AppResult.success(userToken))
    expect(nestTokenService.issue).toHaveBeenCalledExactlyOnceWith('userId', {
      method: 'password',
    })
  })

  it('should returns failedwhen TokenService.issue failed', async () => {
    vi.spyOn(nestTokenService, 'issue').mockRejectedValueOnce(
      new Error('error'),
    )
    const result = await jwt.issue('userId')

    expect(result).toStrictEqual(
      AppResult.failed(
        new AppException({
          status: 500,
          title: 'Failed issueing new jwt token',
          detail: 'Error: error',
        }),
      ),
    )
  })
})
