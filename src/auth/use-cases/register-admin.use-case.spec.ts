import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { User } from '../../user/entities/user.entity.js'
import { UserCredential } from '../entities/user-credential.entity.js'
import {
  RegisterAdminParams,
  RegisterAdminUseCase,
} from './register-admin.user-case.js'
import { CredentialRepository } from '../repositories/credential.repository.js'
import { AppPasswordHasher } from '../utils/app-password-hasher.util.js'
import {
  CreateUserParams,
  CreateUserUseCase,
} from '../../user/use-cases/create-user.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('RegisterAdminUseCase', () => {
  const params = new RegisterAdminParams({
    name: 'name',
    email: 'email',
    password: 'password',
  })
  const user = new User({
    id: 'id',
    name: params.name,
    email: params.name,
  })
  const creds = new UserCredential({
    userId: user.id,
    hashedPassword: 'hashed',
  })
  let credentialRepository = {
    save: vi.fn().mockResolvedValue(AppResult.success(creds)),
  }
  let passwordHasher = {
    hash: vi.fn().mockResolvedValue(AppResult.success(creds.hashedPassword)),
  }
  let createUserUseCase = {
    execute: vi.fn().mockResolvedValue(AppResult.success(user)),
  }
  let registerAdminUseCase: RegisterAdminUseCase

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CredentialRepository,
          useValue: credentialRepository,
        },
        {
          provide: AppPasswordHasher,
          useValue: passwordHasher,
        },
        {
          provide: CreateUserUseCase,
          useValue: createUserUseCase,
        },
        RegisterAdminUseCase,
      ],
    }).compile()

    registerAdminUseCase = moduleRef.get(RegisterAdminUseCase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should call all operations once', async () => {
    await registerAdminUseCase.execute(params)

    expect(createUserUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      new CreateUserParams({ name: params.name, email: params.email }),
    )
    expect(passwordHasher.hash).toHaveBeenCalledExactlyOnceWith(params.password)
    expect(credentialRepository.save).toHaveBeenCalledExactlyOnceWith(
      user.id,
      creds.hashedPassword,
    )
  })

  it('should return correct user', async () => {
    const result = await registerAdminUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(user))
  })

  it('should return failed when CreateUserUseCase is failed', async () => {
    createUserUseCase.execute.mockResolvedValueOnce(
      AppResult.failed(AppException.test()),
    )

    const result = await registerAdminUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(AppException.test()))

    expect(passwordHasher.hash).not.toHaveBeenCalled()
    expect(credentialRepository.save).not.toHaveBeenCalled()
  })

  it('should return failed when AppPasswordHasher.hash is failed', async () => {
    passwordHasher.hash.mockResolvedValueOnce(
      AppResult.failed(AppException.test()),
    )

    const result = await registerAdminUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(AppException.test()))

    expect(credentialRepository.save).not.toHaveBeenCalled()
  })

  it('should return failed when CredentialRepository.save is failed', async () => {
    credentialRepository.save.mockResolvedValueOnce(
      AppResult.failed(AppException.test()),
    )

    const result = await registerAdminUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(AppException.test()))
  })
})
