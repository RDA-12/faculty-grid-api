import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { FunctionalRank } from '../entities/functional-rank.entity.js'
import { FunctionalRankRepository } from '../repositories/functional-rank.repository.js'
import {
  CreateFunctionalRankParams,
  CreateFunctionalRankUseCase,
} from './create-functional-rank.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('CreateFunctionalRankUseCase', () => {
  const params = new CreateFunctionalRankParams({
    name: 'Lektor',
    createdBy: 'createdBy',
  })
  const functionalRank = new FunctionalRank({
    id: 'id',
    name: params.name,
  })
  let functionalRankRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let createFunctionalRankUseCase: CreateFunctionalRankUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FunctionalRankRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(functionalRank)),
          },
        },
        CreateFunctionalRankUseCase,
      ],
    }).compile()

    functionalRankRepository = moduleRef.get(FunctionalRankRepository)
    createFunctionalRankUseCase = moduleRef.get(CreateFunctionalRankUseCase)
  })

  it('should call FunctionalRankRepository.save once', async () => {
    await createFunctionalRankUseCase.execute(params)

    expect(functionalRankRepository.save).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should return success with functional rank when FunctionalRankRepository.save succeeds', async () => {
    const result = await createFunctionalRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(functionalRank))
  })

  it('should return failed with exception when FunctionalRankRepository.save fails', async () => {
    const e = AppException.test()
    vi.spyOn(functionalRankRepository, 'save').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await createFunctionalRankUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
