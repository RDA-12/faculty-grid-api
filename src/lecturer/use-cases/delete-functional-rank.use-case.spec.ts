import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import { DeleteFunctionalRankUseCase } from './delete-functional-rank.use-case.js'

describe('DeleteFunctionalRankUseCase', () => {
  let functionalRankRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteFunctionalRankUseCase: DeleteFunctionalRankUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FunctionalRankRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteFunctionalRankUseCase,
      ],
    }).compile()

    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
    deleteFunctionalRankUseCase = moduleRef.get(DeleteFunctionalRankUseCase)
  })

  it('should call FunctionalRankRepository.deleteById once', async () => {
    await deleteFunctionalRankUseCase.execute('id')

    expect(functionalRankRepository.deleteById).toHaveBeenCalledExactlyOnceWith(
      'id',
    )
  })

  it('should return success when FunctionalRankRepository.deleteById succeeds', async () => {
    const result = await deleteFunctionalRankUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with exception when FunctionalRankRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(functionalRankRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteFunctionalRankUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
