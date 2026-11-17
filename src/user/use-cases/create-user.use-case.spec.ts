import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { User } from '../entities/user.entity.js'
import { UserRepository } from '../repositories/user.repository.js'
import { CreateUserParams, CreateUserUseCase } from './create-user.use-case.js'
import { Test } from '@nestjs/testing'

describe('CreateUserUseCase', () => {
  const params = new CreateUserParams({ name: 'name', email: 'email' })
  let userRepository: UserRepository
  let createUserUseCase: CreateUserUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile()

    userRepository = moduleRef.get(UserRepository)
    createUserUseCase = new CreateUserUseCase(userRepository)
  })

  it('should return success with correct user when UserRepository.save success', async () => {
    const user = new User({
      id: 'id',
      name: params.name,
      email: params.email,
    })
    vi.spyOn(userRepository, 'save').mockImplementation(async () =>
      AppResult.success(user),
    )
    const result = await createUserUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(user))
  })

  it('should return failed with correct exception when UserRepository.save failed', async () => {
    const e = new AppException('')
    vi.spyOn(userRepository, 'save').mockImplementation(async () =>
      AppResult.failed(e),
    )
    const result = await createUserUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
