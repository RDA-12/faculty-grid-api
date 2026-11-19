import { Test } from '@nestjs/testing'
import { Role, UserRoles } from '../entities/role.entity.js'
import { AssignRoleParams, AssignRoleUseCase } from './assign-role.use-case.js'
import { UserRoleRepository } from '../repositories/user-role.repository.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'

describe('AssignRoleUseCase', () => {
  const params = new AssignRoleParams({
    userId: 'userId',
    role: Role.admin,
  })
  const userRoles = new UserRoles({
    userId: params.userId,
    roles: [Role.admin],
  })
  let userRoleRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let assignRoleUseCase: AssignRoleUseCase

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: UserRoleRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(userRoles)),
          },
        },
        AssignRoleUseCase,
      ],
    }).compile()

    userRoleRepository = moduleRef.get(UserRoleRepository)
    assignRoleUseCase = moduleRef.get(AssignRoleUseCase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should calls UserRoleRepository.save once', async () => {
    await assignRoleUseCase.execute(params)

    expect(userRoleRepository.save).toHaveBeenCalledExactlyOnceWith(
      params.userId,
      params.role,
    )
  })

  it('should return correct roles when UserRoleRepository.save success', async () => {
    const result = await assignRoleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(userRoles))
  })

  it('should return failed when UserRoleRepository.save failed', async () => {
    userRoleRepository.save.mockResolvedValueOnce(
      AppResult.failed(AppException.test()),
    )
    const result = await assignRoleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(AppException.test()))
  })
})
