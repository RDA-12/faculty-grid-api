import { GetUserByEmailUseCase } from '../../user/use-cases/get-user-by-email.use-case.js'
import { CredentialRepository } from '../repositories/credential.repository.js'
import { Test } from '@nestjs/testing'
import { LoginParams, LoginUseCase } from './login.use-case.js'
import { User } from '../../user/entities/user.entity.js'
import {
  UserCredential,
  UserToken,
} from '../entities/user-credential.entity.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { AppPasswordHasher } from '../utils/app-password-hasher.util.js'
import { JWT } from '../utils/jwt.util.js'

describe('LoginUseCase', () => {
  const user = new User({ id: 'id', name: 'name', email: 'email@email.com' })
  const params = new LoginParams({ email: user.email, password: 'password' })
  const userCredentials = new UserCredential({
    userId: user.id,
    hashedPassword: 'hashed',
  })
  const userToken: UserToken = new UserToken({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresIn: 10,
  })
  let getUserByEmailUseCase: { execute: ReturnType<typeof vi.fn> }
  let passwordHasher: { verify: ReturnType<typeof vi.fn> }
  let credentialRepository: { getByUserId: ReturnType<typeof vi.fn> }
  let jwt: { issue: ReturnType<typeof vi.fn> }
  let loginUseCase: LoginUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: GetUserByEmailUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(user)),
          },
        },
        {
          provide: AppPasswordHasher,
          useValue: {
            verify: vi.fn().mockResolvedValue(AppResult.success(true)),
          },
        },
        {
          provide: CredentialRepository,
          useValue: {
            getByUserId: vi
              .fn()
              .mockResolvedValue(AppResult.success(userCredentials)),
          },
        },
        {
          provide: JWT,
          useValue: {
            issue: vi.fn().mockResolvedValue(AppResult.success(userToken)),
          },
        },
        LoginUseCase,
      ],
    }).compile()

    getUserByEmailUseCase = moduleRef.get(GetUserByEmailUseCase)
    passwordHasher = moduleRef.get(AppPasswordHasher)
    credentialRepository = moduleRef.get(CredentialRepository)
    jwt = moduleRef.get(JWT)
    loginUseCase = moduleRef.get(LoginUseCase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should calls each process once', async () => {
    await loginUseCase.execute(params)

    expect(getUserByEmailUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      params.email,
    )
    expect(credentialRepository.getByUserId).toHaveBeenCalledExactlyOnceWith(
      user.id,
    )
    expect(passwordHasher.verify).toHaveBeenCalledExactlyOnceWith(
      params.password,
      userCredentials.hashedPassword,
    )
    expect(jwt.issue).toHaveBeenCalledExactlyOnceWith(user.id)
  })

  it('should return correct token', async () => {
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(userToken))
  })

  it('should return failed when GetUserByEmailUseCase failed', async () => {
    const e = new AppException('')
    vi.spyOn(getUserByEmailUseCase, 'execute').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
    expect(credentialRepository.getByUserId).not.toHaveBeenCalled()
    expect(passwordHasher.verify).not.toHaveBeenCalled()
    expect(jwt.issue).not.toHaveBeenCalled()
  })

  it('should return failed when CredentialRepository.getByUserId failed', async () => {
    const e = new AppException('')
    vi.spyOn(credentialRepository, 'getByUserId').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
    expect(passwordHasher.verify).not.toHaveBeenCalled()
    expect(jwt.issue).not.toHaveBeenCalled()
  })

  it('should return failed when AppPasswordHasher.verify failed', async () => {
    const e = new AppException('')
    vi.spyOn(passwordHasher, 'verify').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
    expect(jwt.issue).not.toHaveBeenCalled()
  })

  it('should return failed when TokenService.issue failed', async () => {
    const e = new AppException('')
    vi.spyOn(jwt, 'issue').mockResolvedValueOnce(AppResult.failed(e))
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
