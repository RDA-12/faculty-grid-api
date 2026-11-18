import {
  AuthenticationRegistry,
  IssuedTokens,
  TokenService,
} from '@nestjs/authentication'
import { JWT } from './jwt.util.js'
import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import {
  AppException,
  UnexpectedException,
} from '../../common/app-exception.js'
import { GetUserByIdUseCase } from '../../user/use-cases/get-user-by-id.use-case.js'
import { User } from '../../user/entities/user.entity.js'

describe('JWT', () => {
  const issuedToken: IssuedTokens = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 10,
  }
  const userToken = new UserToken(issuedToken)
  const user = new User({ id: 'id', name: 'name', email: 'email' })
  let nestTokenService: { issue: ReturnType<typeof vi.fn> }
  let getUserByIdUseCase: { execute: ReturnType<typeof vi.fn> }
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
        {
          provide: GetUserByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(user)),
          },
        },
        {
          provide: AuthenticationRegistry,
          useValue: {
            registerProvider: vi.fn(),
          },
        },
        JWT,
      ],
    }).compile()

    nestTokenService = moduleRef.get(TokenService)
    getUserByIdUseCase = moduleRef.get(GetUserByIdUseCase)
    jwt = moduleRef.get(JWT)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('issue', () => {
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
        AppResult.failed(new UnexpectedException('Error: error')),
      )
    })
  })

  describe('verify', () => {
    it('should calls GetUserByIdUseCase once', async () => {
      await jwt.validate({ sub: user.id })

      expect(getUserByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        user.id,
      )
    })

    it('should returns correct user when GetUserByIdUseCase success', async () => {
      const result = await jwt.validate({ sub: user.id })

      expect(result).toStrictEqual(user)
    })

    it('should returns null when GetUserByIdUseCase failed', async () => {
      const e =  AppException.test()
      getUserByIdUseCase.execute.mockResolvedValueOnce(AppResult.failed(e))
      const result = await jwt.validate({ sub: user.id })

      expect(result).toBeNull()
    })
  })
})
