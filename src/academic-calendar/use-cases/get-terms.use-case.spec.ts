import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Term, TermStatus } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'
import { GetTermsParams, GetTermsUseCase } from './get-terms.use-case.js'
import { AppException } from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'

describe('GetTermsUseCase', () => {
  const term = new Term({
    id: 'term-id',
    academicYearId: 'year-id',
    name: '2026/2027 Odd',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    status: TermStatus.active,
  })
  const paginatedResult = new PaginatedResult({
    data: [term],
    pagination: new PaginationResult({
      total: 1,
      page: 1,
      pageSize: 10,
    }),
  })
  let termRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getTermsUseCase: GetTermsUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TermRepository,
          useValue: {
            getAll: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        GetTermsUseCase,
      ],
    }).compile()

    termRepository = moduleRef.get(TermRepository)
    getTermsUseCase = moduleRef.get(GetTermsUseCase)
  })

  it('should call TermRepository.getAll once with params', async () => {
    const params = new GetTermsParams({
      page: 2,
      pageSize: 5,
      academicYearId: 'year-id',
      status: TermStatus.active,
      search: 'Odd',
    })

    await getTermsUseCase.execute(params)

    expect(termRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should call TermRepository.getAll once with undefined when omitted', async () => {
    await getTermsUseCase.execute()

    expect(termRepository.getAll).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it('should return success with paginated terms when TermRepository.getAll succeeds', async () => {
    const result = await getTermsUseCase.execute(new GetTermsParams({}))

    expect(result).toStrictEqual(AppResult.success(paginatedResult))
  })

  it('should return failed with exception when TermRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(termRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )

    const result = await getTermsUseCase.execute(new GetTermsParams({}))

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
