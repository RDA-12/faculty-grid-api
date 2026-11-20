import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Test } from '@nestjs/testing'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import { GetFacultiesUseCase } from './get-faculties.use-case.js'

describe('GetFacultiesUseCase', () => {
  const faculties = Array.from({ length: 5 }, (_, index) => {
    return new Faculty({
      id: `${index}`,
      name: `Faculty ${index}`,
    })
  })
  let facultyRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getFacultiesUseCase: GetFacultiesUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FacultyRepository,
          useValue: {
            getAll: vi.fn().mockResolvedValue(AppResult.success(faculties)),
          },
        },
        GetFacultiesUseCase,
      ],
    }).compile()

    facultyRepository = moduleRef.get(FacultyRepository)
    getFacultiesUseCase = moduleRef.get(GetFacultiesUseCase)
  })

  it('should calls FacultyRepository.getAll once', async () => {
    await getFacultiesUseCase.execute()

    expect(facultyRepository.getAll).toHaveBeenCalledOnce()
  })

  it('should return success with correct faculty when FacultyRepository.getAll success', async () => {
    const result = await getFacultiesUseCase.execute()

    expect(result).toStrictEqual(AppResult.success(faculties))
  })

  it('should return failed with correct exception when FacultyRepository.getAll failed', async () => {
    const e = AppException.test()
    vi.spyOn(facultyRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getFacultiesUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
