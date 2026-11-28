import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Rank, RankType } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'
import { UpdateRankParams, UpdateRankUseCase } from './update-rank.use-case.js'

describe('UpdateRankUseCase', () => {
  const params = new UpdateRankParams({
    id: 'id',
    name: 'Mayor',
    type: RankType.military,
  })
  const rank = new Rank({
    id: params.id,
    name: params.name,
    type: params.type,
  })
  let rankRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let updateRankUseCase: UpdateRankUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RankRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(rank)),
          },
        },
        UpdateRankUseCase,
      ],
    }).compile()

    rankRepository = moduleRef.get(RankRepository)
    updateRankUseCase = moduleRef.get(UpdateRankUseCase)
  })

  it('should call RankRepository.update once', async () => {
    await updateRankUseCase.execute(params)

    expect(rankRepository.update).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with updated rank when RankRepository.update succeeds', async () => {
    const result = await updateRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(rank))
  })

  it('should return failed with exception when RankRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(rankRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await updateRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
