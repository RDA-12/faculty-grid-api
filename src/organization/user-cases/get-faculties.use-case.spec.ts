import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Test } from '@nestjs/testing'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import {
  GetFacultiesParams,
  GetFacultiesUseCase,
} from './get-faculties.use-case.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'

describe('GetFacultiesUseCase', () => {
  const faculties = Array.from({ length: 5 }, (_, index) => {
    return new Faculty({
      id: `${index}`,
      name: `Faculty ${index}`,
    })
  })
  const paginated = new PaginatedResult({
    data: faculties,
    pagination: new PaginationResult({
      page: 1,
      pageSize: 10,
      total: 5,
    }),
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
            getAll: vi.fn().mockResolvedValue(AppResult.success(paginated)),
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

    expect(result).toStrictEqual(AppResult.success(paginated))
  })

  it('should return failed with correct exception when FacultyRepository.getAll failed', async () => {
    const e = AppException.test()
    vi.spyOn(facultyRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getFacultiesUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })

  it('should calls FacultyRepository.getAll once with search params', async () => {
    const params = new GetFacultiesParams({
      search: 'lol',
    })

    await getFacultiesUseCase.execute(params)

    expect(facultyRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })
})
