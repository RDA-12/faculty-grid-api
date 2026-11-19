import { Test } from '@nestjs/testing'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import { AuthController } from './auth.controller.js'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import {
  AuthUserOut,
  LoginDTO,
  RegisterAdminDTO,
  UserTokenOut,
} from './auth.dto.js'
import { AppException } from '../../common/app-exception.js'
import {
  RegisterAdminParams,
  RegisterAdminUseCase,
} from '../use-cases/register-admin.user-case.js'
import { User } from '../../user/entities/user.entity.js'

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
      ],
    }).compile()

    loginUseCase = moduleRef.get(LoginUseCase)
    registerAdminUseCase = moduleRef.get(RegisterAdminUseCase)

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
      await authController.registerAdmin(registerAdminRequest)

      expect(registerAdminUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return correct user when RegisterAdminUseCase success', async () => {
      const result = await authController.registerAdmin(registerAdminRequest)

      expect(result).toStrictEqual(
        AppResult.success(AuthUserOut.fromUser(user)),
      )
    })

    it('should returns failed when RegisterAdminUseCase failed', async () => {
      const e = AppException.test()
      vi.spyOn(registerAdminUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await authController.registerAdmin(registerAdminRequest)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
