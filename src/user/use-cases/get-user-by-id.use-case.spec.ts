import { Test } from '@nestjs/testing'
import { User } from '../entities/user.entity.js'
import { UserRepository } from '../repositories/user.repository.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { GetUserByIdUseCase } from './get-user-by-id.use-case.js'

describe('GetUserByIdUseCase', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'Id@Id.com',
  })
  let userRepository: UserRepository
  let getUserByIdUseCase: GetUserByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: UserRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(user)),
          },
        },
        GetUserByIdUseCase,
      ],
    }).compile()

    userRepository = moduleRef.get(UserRepository)
    getUserByIdUseCase = moduleRef.get(GetUserByIdUseCase)
  })

  it('should return correct user when UserRepository.getById success', async () => {
    const result = await getUserByIdUseCase.execute(user.id)

    expect(result).toStrictEqual(AppResult.success(user))
  })

  it('should return failed with correct exception when UserRepository.getById failed', async () => {
    const e = new AppException({
      status: 500,
      title: '',
      detail: '',
    })
    vi.spyOn(userRepository, 'getById').mockResolvedValue(AppResult.failed(e))
    const result = await getUserByIdUseCase.execute(user.id)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
