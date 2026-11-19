import { Test } from '@nestjs/testing'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import { AuthController } from './auth.controller.js'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import {
  AuthUserOut,
  LoginDTO,
  RefreshTokenDTO,
  RegisterAdminDTO,
  UserTokenOut,
} from './auth.dto.js'
import { AppException } from '../../common/app-exception.js'
import {
  RegisterAdminParams,
  RegisterAdminUseCase,
} from '../use-cases/register-admin.user-case.js'
import { User } from '../../user/entities/user.entity.js'
import { ConfigService } from '@nestjs/config'
import { RefreshAccessTokenUseCase } from '../use-cases/refresh-access-token.use-case.js'

describe('AuthController', () => {
  const userToken = new UserToken({
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 10,
  })
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email',
  })
  const userTokenOut = UserTokenOut.fromUserToken(userToken)
  let loginUseCase: { execute: ReturnType<typeof vi.fn> }
  let registerAdminUseCase: { execute: ReturnType<typeof vi.fn> }
  let refreshAccessTokenUseCase: { execute: ReturnType<typeof vi.fn> }
  let authController: AuthController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(userToken)),
          },
        },
        {
          provide: RegisterAdminUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(user)),
          },
        },
        {
          provide: RefreshAccessTokenUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(userToken)),
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile()

    loginUseCase = moduleRef.get(LoginUseCase)
    registerAdminUseCase = moduleRef.get(RegisterAdminUseCase)
    refreshAccessTokenUseCase = moduleRef.get(RefreshAccessTokenUseCase)

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
      const e = AppException.test()
      vi.spyOn(loginUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await authController.login(loginRequest)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('registerAdmin', () => {
    const registerAdminRequest = new RegisterAdminDTO()
    registerAdminRequest.name = user.name
    registerAdminRequest.email = user.email
    registerAdminRequest.password = 'password'
    const params = new RegisterAdminParams({
      name: registerAdminRequest.name,
      email: registerAdminRequest.email,
      password: registerAdminRequest.password,
    })

    it('calls RegisterAdminUseCase once', async () => {
      await authController.registerAdmin('key', registerAdminRequest)

      expect(registerAdminUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return correct user when RegisterAdminUseCase success', async () => {
      const result = await authController.registerAdmin(
        'key',
        registerAdminRequest,
      )

      expect(result).toStrictEqual(
        AppResult.success(AuthUserOut.fromUser(user)),
      )
    })

    it('should returns failed when RegisterAdminUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(registerAdminUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await authController.registerAdmin(
        'key',
        registerAdminRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('refreshAccessToken', () => {
    const refreshAccessTokenRequest = new RefreshTokenDTO('refresh')
    const params = refreshAccessTokenRequest.refreshToken

    it('calls RefreshAccessTokenUseCase once', async () => {
      await authController.refreshAccessToken(refreshAccessTokenRequest)

      expect(refreshAccessTokenUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return correct user token when RefreshAccessTokenUseCase success', async () => {
      const result = await authController.refreshAccessToken(
        refreshAccessTokenRequest,
      )

      expect(result).toStrictEqual(AppResult.success(userTokenOut))
    })

    it('should returns failed when RefreshAccessTokenUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(refreshAccessTokenUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await authController.refreshAccessToken(
        refreshAccessTokenRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
