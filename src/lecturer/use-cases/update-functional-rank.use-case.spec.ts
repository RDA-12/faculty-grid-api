import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import {
  UpdateFunctionalRankParams,
  UpdateFunctionalRankUseCase,
} from './update-functional-rank.use-case.js'

describe('UpdateFunctionalRankUseCase', () => {
  const params = new UpdateFunctionalRankParams({
    id: 'id',
    name: 'Lektor Kepala',
  })
  const functionalRank = new FunctionalRank({
    id: params.id,
    name: params.name,
  })
  let functionalRankRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let updateFunctionalRankUseCase: UpdateFunctionalRankUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FunctionalRankRepository,
          useValue: {
            update: vi
              .fn()
              .mockResolvedValue(AppResult.success(functionalRank)),
          },
        },
        UpdateFunctionalRankUseCase,
      ],
    }).compile()

    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
    updateFunctionalRankUseCase = moduleRef.get(UpdateFunctionalRankUseCase)
  })

  it('should call FunctionalRankRepository.update once', async () => {
    await updateFunctionalRankUseCase.execute(params)

    expect(functionalRankRepository.update).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should return success with updated functional rank when FunctionalRankRepository.update succeeds', async () => {
    const result = await updateFunctionalRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(functionalRank))
  })

  it('should return failed with exception when FunctionalRankRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(functionalRankRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await updateFunctionalRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
