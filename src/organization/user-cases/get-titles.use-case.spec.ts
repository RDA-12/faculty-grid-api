import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import { Title, TitleScope } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'
import { GetTitlesParams, GetTitlesUseCase } from './get-titles.use-case.js'

describe('GetTitlesUseCase', () => {
  const titles = Array.from({ length: 5 }, (_, index) => {
    return new Title({
      id: `${index}`,
      name: `Title ${index}`,
      scope: TitleScope.faculty,
    })
  })
  const paginated = new PaginatedResult({
    data: titles,
    pagination: new PaginationResult({
      page: 1,
      pageSize: 10,
      total: 5,
    }),
  })
  let titleRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getTitlesUseCase: GetTitlesUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TitleRepository,
          useValue: {
            getAll: vi.fn().mockResolvedValue(AppResult.success(paginated)),
          },
        },
        GetTitlesUseCase,
      ],
    }).compile()

    titleRepository = moduleRef.get(TitleRepository)
    getTitlesUseCase = moduleRef.get(GetTitlesUseCase)
  })

  it('should call TitleRepository.getAll once', async () => {
    const params = new Pagination({})
    await getTitlesUseCase.execute(params)

    expect(titleRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should call TitleRepository.getAll once with scope filter', async () => {
    const params = new GetTitlesParams({ scope: TitleScope.program })
    await getTitlesUseCase.execute(params)

    expect(titleRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should call TitleRepository.getAll once with search filter', async () => {
    const params = new GetTitlesParams({ search: 'Dean' })
    await getTitlesUseCase.execute(params)

    expect(titleRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with titles when TitleRepository.getAll succeeds', async () => {
    const result = await getTitlesUseCase.execute()

    expect(result).toStrictEqual(AppResult.success(paginated))
  })

  it('should return failed with exception when TitleRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(titleRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getTitlesUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
