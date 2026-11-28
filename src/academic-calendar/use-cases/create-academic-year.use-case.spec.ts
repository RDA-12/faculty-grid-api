import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'
import {
  CreateAcademicYearParams,
  CreateAcademicYearUseCase,
} from './create-academic-year.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('CreateAcademicYearUseCase', () => {
  const params = new CreateAcademicYearParams({
    name: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    createdBy: 'createdBy',
  })
  const academicYear = new AcademicYear({
    id: 'id',
    name: params.name,
    startDate: params.startDate,
    endDate: params.endDate,
    status: AcademicYearStatus.planned,
  })
  let academicYearRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let createAcademicYearUseCase: CreateAcademicYearUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AcademicYearRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        CreateAcademicYearUseCase,
      ],
    }).compile()

    academicYearRepository = moduleRef.get(AcademicYearRepository)
    createAcademicYearUseCase = moduleRef.get(CreateAcademicYearUseCase)
  })

  it('should default status to planned when omitted', () => {
    expect(params.status).toBe(AcademicYearStatus.planned)
  })

  it('should call AcademicYearRepository.save once', async () => {
    await createAcademicYearUseCase.execute(params)

    expect(academicYearRepository.save).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with academic year when AcademicYearRepository.save succeeds', async () => {
    const result = await createAcademicYearUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(academicYear))
  })

  it('should return failed with exception when AcademicYearRepository.save fails', async () => {
    const e = AppException.test()
    vi.spyOn(academicYearRepository, 'save').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await createAcademicYearUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
