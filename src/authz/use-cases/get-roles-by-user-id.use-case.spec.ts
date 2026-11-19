import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { Role, UserRoles } from '../entities/role.entity.js'
import { UserRoleRepository } from '../repositories/user-role.repository.js'
import { GetRolesByUserIdUseCase } from './get-roles-by-user-id.use-case.js'

describe('GetRolesByUserIdUseCase', () => {
  const userRoles = new UserRoles({
    userId: 'userId',
    roles: [Role.admin],
  })
  let userRoleRepository: {
    getByUserId: ReturnType<typeof vi.fn>
  }
  let getRolesByUserIdUseCase: GetRolesByUserIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: UserRoleRepository,
          useValue: {
            getByUserId: vi
              .fn()
              .mockResolvedValue(AppResult.success(userRoles)),
          },
        },
        GetRolesByUserIdUseCase,
      ],
    }).compile()

    userRoleRepository = moduleRef.get(UserRoleRepository)
    getRolesByUserIdUseCase = moduleRef.get(GetRolesByUserIdUseCase)
  })

  it('should calls UserRoleRepository.getByUserId once', async () => {
    await getRolesByUserIdUseCase.execute(userRoles.userId)

    expect(userRoleRepository.getByUserId).toHaveBeenCalledExactlyOnceWith(
      userRoles.userId,
    )
  })

  it('should return correct roles when UserRoleRepository.getByUserId success', async () => {
    const result = await getRolesByUserIdUseCase.execute(userRoles.userId)

    expect(result).toStrictEqual(AppResult.success(userRoles))
  })

  it('should return failed with correct exception when UserRoleRepository.getByUserId failed', async () => {
    const e = AppException.test()
    vi.spyOn(userRoleRepository, 'getByUserId').mockResolvedValue(
      AppResult.failed(e),
    )
    const result = await getRolesByUserIdUseCase.execute(userRoles.userId)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
