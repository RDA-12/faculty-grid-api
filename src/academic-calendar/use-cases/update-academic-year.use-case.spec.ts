import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'
import {
  UpdateAcademicYearParams,
  UpdateAcademicYearUseCase,
} from './update-academic-year.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('UpdateAcademicYearUseCase', () => {
  const params = new UpdateAcademicYearParams({
    id: 'year-id',
    name: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    status: AcademicYearStatus.active,
  })
  const academicYear = new AcademicYear({
    id: params.id,
    name: params.name,
    startDate: params.startDate,
    endDate: params.endDate,
    status: params.status,
  })
  let academicYearRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let updateAcademicYearUseCase: UpdateAcademicYearUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AcademicYearRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        UpdateAcademicYearUseCase,
      ],
    }).compile()

    academicYearRepository = moduleRef.get(AcademicYearRepository)
    updateAcademicYearUseCase = moduleRef.get(UpdateAcademicYearUseCase)
  })

  it('should call AcademicYearRepository.update once', async () => {
    await updateAcademicYearUseCase.execute(params)

    expect(academicYearRepository.update).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should return success with academic year when AcademicYearRepository.update succeeds', async () => {
    const result = await updateAcademicYearUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(academicYear))
  })

  it('should return failed with exception when AcademicYearRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(academicYearRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await updateAcademicYearUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
