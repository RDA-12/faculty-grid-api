import { AuthenticationModule } from '@nestjs/authentication'
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
import { UserRepository } from '../../user/repositories/user.repository.js'
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
  let getUserByEmailUseCase: GetUserByEmailUseCase
  let passwordHasher: AppPasswordHasher
  let credentialRepository: CredentialRepository
  let jwt: JWT
  let loginUseCase: LoginUseCase

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
        GetUserByEmailUseCase,
        AppPasswordHasher,
        JWT,
        LoginUseCase,
      ],
    }).compile()

    getUserByEmailUseCase = moduleRef.get(GetUserByEmailUseCase)
    vi.spyOn(getUserByEmailUseCase, 'execute').mockResolvedValue(
      AppResult.success(user),
    )
    passwordHasher = moduleRef.get(AppPasswordHasher)
    vi.spyOn(passwordHasher, 'verify').mockResolvedValue(
      AppResult.success(true),
    )
    credentialRepository = moduleRef.get(CredentialRepository)
    vi.spyOn(credentialRepository, 'getByUserId').mockResolvedValue(
      AppResult.success(userCredentials),
    )
    jwt = moduleRef.get(JWT)
    vi.spyOn(jwt, 'issue').mockResolvedValue(AppResult.success(userToken))
    loginUseCase = new LoginUseCase(
      getUserByEmailUseCase,
      passwordHasher,
      credentialRepository,
      jwt,
    )
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
    vi.spyOn(getUserByEmailUseCase, 'execute').mockResolvedValue(
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
    vi.spyOn(credentialRepository, 'getByUserId').mockResolvedValue(
      AppResult.failed(e),
    )
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
    expect(passwordHasher.verify).not.toHaveBeenCalled()
    expect(jwt.issue).not.toHaveBeenCalled()
  })

  it('should return failed when AppPasswordHasher.verify failed', async () => {
    const e = new AppException('')
    vi.spyOn(passwordHasher, 'verify').mockResolvedValue(AppResult.failed(e))
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
    expect(jwt.issue).not.toHaveBeenCalled()
  })

  it('should return failed when TokenService.issue failed', async () => {
    const e = new AppException('')
    vi.spyOn(jwt, 'issue').mockResolvedValue(AppResult.failed(e))
    const result = await loginUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
