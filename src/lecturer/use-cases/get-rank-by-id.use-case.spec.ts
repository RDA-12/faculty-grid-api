import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Rank, RankType } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'
import { GetRankByIdUseCase } from './get-rank-by-id.use-case.js'

describe('GetRankByIdUseCase', () => {
  const rank = new Rank({
    id: 'id',
    name: 'Penata Muda (III/a)',
    type: RankType.asn,
  })
  let rankRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getRankByIdUseCase: GetRankByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RankRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(rank)),
          },
        },
        GetRankByIdUseCase,
      ],
    }).compile()

    rankRepository = moduleRef.get(RankRepository)
    getRankByIdUseCase = moduleRef.get(GetRankByIdUseCase)
  })

  it('should call RankRepository.getById once', async () => {
    await getRankByIdUseCase.execute('id')

    expect(rankRepository.getById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success with rank when RankRepository.getById succeeds', async () => {
    const result = await getRankByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(rank))
  })

  it('should return failed with exception when RankRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(rankRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getRankByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
