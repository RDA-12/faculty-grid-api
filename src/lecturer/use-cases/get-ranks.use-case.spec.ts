import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import { Rank, RankType } from '../entities/rank.entity.js'
import { RankRepository } from '../repositories/rank.repository.js'
import { GetRanksParams, GetRanksUseCase } from './get-ranks.use-case.js'

describe('GetRanksUseCase', () => {
  const ranks = Array.from({ length: 5 }, (_, index) => {
    return new Rank({
      id: `${index}`,
      name: `Rank ${index}`,
      type: RankType.asn,
    })
  })
  const paginated = new PaginatedResult({
    data: ranks,
    pagination: new PaginationResult({
      page: 1,
      pageSize: 10,
      total: 5,
    }),
  })
  let rankRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getRanksUseCase: GetRanksUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RankRepository,
          useValue: {
            getAll: vi.fn().mockResolvedValue(AppResult.success(paginated)),
          },
        },
        GetRanksUseCase,
      ],
    }).compile()

    rankRepository = moduleRef.get(RankRepository)
    getRanksUseCase = moduleRef.get(GetRanksUseCase)
  })

  it('should call RankRepository.getAll once', async () => {
    const params = new Pagination({})
    await getRanksUseCase.execute(params)

    expect(rankRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should call RankRepository.getAll once with type filter', async () => {
    const params = new GetRanksParams({ type: RankType.military })
    await getRanksUseCase.execute(params)

    expect(rankRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should call RankRepository.getAll once with search filter', async () => {
    const params = new GetRanksParams({ search: 'Penata' })
    await getRanksUseCase.execute(params)

    expect(rankRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with ranks when RankRepository.getAll succeeds', async () => {
    const result = await getRanksUseCase.execute()

    expect(result).toStrictEqual(AppResult.success(paginated))
  })

  it('should return failed with exception when RankRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(rankRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getRanksUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
