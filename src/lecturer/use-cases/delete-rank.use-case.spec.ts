import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { RankRepository } from '../repositories/rank.repository.js'
import { DeleteRankUseCase } from './delete-rank.use-case.js'

describe('DeleteRankUseCase', () => {
  let rankRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteRankUseCase: DeleteRankUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RankRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteRankUseCase,
      ],
    }).compile()

    rankRepository = moduleRef.get(RankRepository)
    deleteRankUseCase = moduleRef.get(DeleteRankUseCase)
  })

  it('should call RankRepository.deleteById once', async () => {
    await deleteRankUseCase.execute('id')

    expect(rankRepository.deleteById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success when RankRepository.deleteById succeeds', async () => {
    const result = await deleteRankUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with exception when RankRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(rankRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteRankUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
