import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Rank, RankType } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'
import { CreateRankParams, CreateRankUseCase } from './create-rank.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('CreateRankUseCase', () => {
  const params = new CreateRankParams({
    name: 'Penata Muda (III/a)',
    type: RankType.asn,
    createdBy: 'createdBy',
  })
  const rank = new Rank({
    id: 'id',
    name: params.name,
    type: params.type,
  })
  let rankRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let createRankUseCase: CreateRankUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RankRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(rank)),
          },
        },
        CreateRankUseCase,
      ],
    }).compile()

    rankRepository = moduleRef.get(RankRepository)
    createRankUseCase = moduleRef.get(CreateRankUseCase)
  })

  it('should call RankRepository.save once', async () => {
    await createRankUseCase.execute(params)

    expect(rankRepository.save).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with rank when RankRepository.save succeeds', async () => {
    const result = await createRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(rank))
  })

  it('should return failed with exception when RankRepository.save fails', async () => {
    const e = AppException.test()
    vi.spyOn(rankRepository, 'save').mockResolvedValueOnce(AppResult.failed(e))
    const result = await createRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
