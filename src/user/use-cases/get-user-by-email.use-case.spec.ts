import { Test } from '@nestjs/testing'
import { User } from '../entities/user.entity.js'
import { UserRepository } from '../repositories/user.repository.js'
import { GetUserByEmailUseCase } from './get-user-by-email.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'

describe('GetUserByEmailUseCase', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email@email.com',
  })
  let userRepository: UserRepository
  let getUserByEmailUseCase: GetUserByEmailUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: UserRepository,
          useValue: {
            getByEmail: vi.fn().mockResolvedValue(AppResult.success(user)),
          },
        },
        GetUserByEmailUseCase,
      ],
    }).compile()

    userRepository = moduleRef.get(UserRepository)
    getUserByEmailUseCase = moduleRef.get(GetUserByEmailUseCase)
  })

  it('should return correct user when UserRepository.getByEmail success', async () => {
    const result = await getUserByEmailUseCase.execute(user.email)

    expect(result).toStrictEqual(AppResult.success(user))
  })

  it('should return failed with correct exception when UserRepository.getByEmail failed', async () => {
    const e = AppException.test()
    vi.spyOn(userRepository, 'getByEmail').mockResolvedValue(
      AppResult.failed(e),
    )
    const result = await getUserByEmailUseCase.execute(user.email)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
