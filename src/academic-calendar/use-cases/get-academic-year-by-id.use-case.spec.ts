import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'
import { GetAcademicYearByIdUseCase } from './get-academic-year-by-id.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('GetAcademicYearByIdUseCase', () => {
  const academicYear = new AcademicYear({
    id: 'year-id',
    name: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    status: AcademicYearStatus.planned,
  })
  let academicYearRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getAcademicYearByIdUseCase: GetAcademicYearByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AcademicYearRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        GetAcademicYearByIdUseCase,
      ],
    }).compile()

    academicYearRepository = moduleRef.get(AcademicYearRepository)
    getAcademicYearByIdUseCase = moduleRef.get(GetAcademicYearByIdUseCase)
  })

  it('should call AcademicYearRepository.getById once', async () => {
    await getAcademicYearByIdUseCase.execute('year-id')

    expect(academicYearRepository.getById).toHaveBeenCalledExactlyOnceWith(
      'year-id',
    )
  })

  it('should return success with academic year when AcademicYearRepository.getById succeeds', async () => {
    const result = await getAcademicYearByIdUseCase.execute('year-id')

    expect(result).toStrictEqual(AppResult.success(academicYear))
  })

  it('should return failed with exception when AcademicYearRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(academicYearRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getAcademicYearByIdUseCase.execute('year-id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
