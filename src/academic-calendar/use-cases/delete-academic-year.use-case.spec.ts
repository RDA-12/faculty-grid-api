import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { AcademicYearRepository } from '../repositories/academic-year.repository.js'
import { DeleteAcademicYearUseCase } from './delete-academic-year.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('DeleteAcademicYearUseCase', () => {
  let academicYearRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteAcademicYearUseCase: DeleteAcademicYearUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AcademicYearRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteAcademicYearUseCase,
      ],
    }).compile()

    academicYearRepository = moduleRef.get(AcademicYearRepository)
    deleteAcademicYearUseCase = moduleRef.get(DeleteAcademicYearUseCase)
  })

  it('should call AcademicYearRepository.deleteById once', async () => {
    await deleteAcademicYearUseCase.execute('year-id')

    expect(academicYearRepository.deleteById).toHaveBeenCalledExactlyOnceWith(
      'year-id',
    )
  })

  it('should return success with null when AcademicYearRepository.deleteById succeeds', async () => {
    const result = await deleteAcademicYearUseCase.execute('year-id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with exception when AcademicYearRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(academicYearRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteAcademicYearUseCase.execute('year-id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
