import { Test } from '@nestjs/testing'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import { AuthController } from './auth.controller.js'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import { LoginDTO, UserTokenOut } from './auth.dto.js'
import { AppException } from '../../common/app-exception.js'
import { AuthenticationModule } from '@nestjs/authentication'
import { CredentialRepository } from '../repositories/credential.repository.js'
import { UserRepository } from '../../user/repositories/user.repository.js'
import { GetUserByEmailUseCase } from '../../user/use-cases/get-user-by-email.use-case.js'
import { AppPasswordHasher } from '../utils/app-password-hasher.util.js'
import { JWT } from '../utils/jwt.util.js'

describe('AuthController', () => {
  const userToken = new UserToken({
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 10,
  })
  const userTokenOut = UserTokenOut.fromUserToken(userToken)
  let loginUseCase: LoginUseCase
  let authController: AuthController

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthenticationModule.forRoot({
          accessToken: {
            key: '3cc4238a01a83902c646ac6e4c288971dcaffc491d7477b8843504838e76d6ab',
            issuer: 'http://localhost:8000',
            audience: 'web',
            ttl: '15m',
          },
        }),
      ],
      providers: [
        CredentialRepository,
        UserRepository,
        AppPasswordHasher,
        JWT,
        GetUserByEmailUseCase,
        LoginUseCase,
      ],
    }).compile()

    loginUseCase = moduleRef.get(LoginUseCase)
    vi.spyOn(loginUseCase, 'execute').mockResolvedValue(
      AppResult.success(userToken),
    )

    authController = new AuthController(loginUseCase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    const loginRequest = new LoginDTO()
    loginRequest.email = 'email@email.com'
    loginRequest.password = 'password'
    const params = new LoginParams({
      email: loginRequest.email,
      password: loginRequest.password,
    })

    it('calls LoginUseCase once', async () => {
      await authController.login(loginRequest)

      expect(loginUseCase.execute).toHaveBeenCalledExactlyOnceWith(params)
    })

    it('should return correct user token when LoginUseCase success', async () => {
      const result = await authController.login(loginRequest)

      expect(result).toStrictEqual(AppResult.success(userTokenOut))
    })

    it('should returns failed when LoginUseCase failed', async () => {
      const e = new AppException('')
      vi.spyOn(loginUseCase, 'execute').mockResolvedValue(AppResult.failed(e))

      const result = await authController.login(loginRequest)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
