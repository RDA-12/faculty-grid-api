import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'
import {
  GetAcademicYearsParams,
  GetAcademicYearsUseCase,
} from './get-academic-years.use-case.js'
import { AppException } from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'

describe('GetAcademicYearsUseCase', () => {
  const academicYear = new AcademicYear({
    id: 'id',
    name: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    status: AcademicYearStatus.active,
  })
  const paginatedResult = new PaginatedResult({
    data: [academicYear],
    pagination: new PaginationResult({
      total: 1,
      page: 1,
      pageSize: 10,
    }),
  })
  let academicYearRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getAcademicYearsUseCase: GetAcademicYearsUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AcademicYearRepository,
          useValue: {
            getAll: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        GetAcademicYearsUseCase,
      ],
    }).compile()

    academicYearRepository = moduleRef.get(AcademicYearRepository)
    getAcademicYearsUseCase = moduleRef.get(GetAcademicYearsUseCase)
  })

  it('should call AcademicYearRepository.getAll once with params', async () => {
    const params = new GetAcademicYearsParams({
      page: 2,
      pageSize: 5,
      status: AcademicYearStatus.active,
      search: '2026',
    })

    await getAcademicYearsUseCase.execute(params)

    expect(academicYearRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should call AcademicYearRepository.getAll once with undefined when omitted', async () => {
    await getAcademicYearsUseCase.execute()

    expect(academicYearRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      undefined,
    )
  })

  it('should return success with paginated academic years when AcademicYearRepository.getAll succeeds', async () => {
    const result = await getAcademicYearsUseCase.execute(
      new GetAcademicYearsParams({}),
    )

    expect(result).toStrictEqual(AppResult.success(paginatedResult))
  })

  it('should return failed with exception when AcademicYearRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(academicYearRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getAcademicYearsUseCase.execute(
      new GetAcademicYearsParams({}),
    )

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
