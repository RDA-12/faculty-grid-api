import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import { GetFunctionalRankByIdUseCase } from './get-functional-rank-by-id.use-case.js'

describe('GetFunctionalRankByIdUseCase', () => {
  const functionalRank = new FunctionalRank({
    id: 'id',
    name: 'Lektor',
  })
  let functionalRankRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getFunctionalRankByIdUseCase: GetFunctionalRankByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FunctionalRankRepository,
          useValue: {
            getById: vi
              .fn()
              .mockResolvedValue(AppResult.success(functionalRank)),
          },
        },
        GetFunctionalRankByIdUseCase,
      ],
    }).compile()

    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
    getFunctionalRankByIdUseCase = moduleRef.get(GetFunctionalRankByIdUseCase)
  })

  it('should call FunctionalRankRepository.getById once', async () => {
    await getFunctionalRankByIdUseCase.execute('id')

    expect(functionalRankRepository.getById).toHaveBeenCalledExactlyOnceWith(
      'id',
    )
  })

  it('should return success with functional rank when FunctionalRankRepository.getById succeeds', async () => {
    const result = await getFunctionalRankByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(functionalRank))
  })

  it('should return failed with exception when FunctionalRankRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(functionalRankRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getFunctionalRankByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
