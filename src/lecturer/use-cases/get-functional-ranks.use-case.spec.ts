import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import {
  GetFunctionalRanksParams,
  GetFunctionalRanksUseCase,
} from './get-functional-ranks.use-case.js'

describe('GetFunctionalRanksUseCase', () => {
  const functionalRanks = Array.from({ length: 5 }, (_, index) => {
    return new FunctionalRank({
      id: `${index}`,
      name: `Functional Rank ${index}`,
    })
  })
  const paginated = new PaginatedResult({
    data: functionalRanks,
    pagination: new PaginationResult({
      page: 1,
      pageSize: 10,
      total: 5,
    }),
  })
  let functionalRankRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getFunctionalRanksUseCase: GetFunctionalRanksUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FunctionalRankRepository,
          useValue: {
            getAll: vi.fn().mockResolvedValue(AppResult.success(paginated)),
          },
        },
        GetFunctionalRanksUseCase,
      ],
    }).compile()

    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
    getFunctionalRanksUseCase = moduleRef.get(GetFunctionalRanksUseCase)
  })

  it('should call FunctionalRankRepository.getAll once', async () => {
    const params = new Pagination({})
    await getFunctionalRanksUseCase.execute(params)

    expect(functionalRankRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should call FunctionalRankRepository.getAll once with search filter', async () => {
    const params = new GetFunctionalRanksParams({ search: 'Lektor' })
    await getFunctionalRanksUseCase.execute(params)

    expect(functionalRankRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should return success with functional ranks when FunctionalRankRepository.getAll succeeds', async () => {
    const result = await getFunctionalRanksUseCase.execute()

    expect(result).toStrictEqual(AppResult.success(paginated))
  })

  it('should return failed with exception when FunctionalRankRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(functionalRankRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getFunctionalRanksUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
