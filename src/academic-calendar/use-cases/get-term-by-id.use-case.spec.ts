import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Term, TermStatus } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'
import { GetTermByIdUseCase } from './get-term-by-id.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('GetTermByIdUseCase', () => {
  const term = new Term({
    id: 'term-id',
    academicYearId: 'year-id',
    name: '2026/2027 Odd',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    status: TermStatus.planned,
  })
  let termRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getTermByIdUseCase: GetTermByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TermRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(term)),
          },
        },
        GetTermByIdUseCase,
      ],
    }).compile()

    termRepository = moduleRef.get(TermRepository)
    getTermByIdUseCase = moduleRef.get(GetTermByIdUseCase)
  })

  it('should call TermRepository.getById once', async () => {
    await getTermByIdUseCase.execute('term-id')

    expect(termRepository.getById).toHaveBeenCalledExactlyOnceWith('term-id')
  })

  it('should return success with term when TermRepository.getById succeeds', async () => {
    const result = await getTermByIdUseCase.execute('term-id')

    expect(result).toStrictEqual(AppResult.success(term))
  })

  it('should return failed with exception when TermRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(termRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )

    const result = await getTermByIdUseCase.execute('term-id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
