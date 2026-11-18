import { Test } from '@nestjs/testing'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import { AuthController } from './auth.controller.js'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import { LoginDTO, UserTokenOut } from './auth.dto.js'
import { AppException } from '../../common/app-exception.js'

describe('AuthController', () => {
  const userToken = new UserToken({
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 10,
  })
  const userTokenOut = UserTokenOut.fromUserToken(userToken)
  let loginUseCase: { execute: ReturnType<typeof vi.fn> }
  let authController: AuthController

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(userToken)),
          },
        },
      ],
    }).compile()

    loginUseCase = moduleRef.get(LoginUseCase)

    authController = moduleRef.get(AuthController)
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
      vi.spyOn(loginUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await authController.login(loginRequest)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
