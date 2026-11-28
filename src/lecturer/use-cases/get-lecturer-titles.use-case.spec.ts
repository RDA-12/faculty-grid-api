import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import {
  GetLecturerTitlesParams,
  GetLecturerTitlesUseCase,
} from './get-lecturer-titles.use-case.js'

describe('GetLecturerTitlesUseCase', () => {
  const assignments = Array.from({ length: 3 }, (_, index) => {
    return new LecturerTitle({
      id: `${index}`,
      lecturerId: 'lecturer-id',
      titleId: 'title-id',
      facultyId: 'faculty-id',
      programId: null,
      startDate: '2026-01-01',
      endDate: null,
    })
  })
  const paginated = new PaginatedResult({
    data: assignments,
    pagination: new PaginationResult({
      page: 1,
      pageSize: 10,
      total: 3,
    }),
  })
  let lecturerTitleRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getLecturerTitlesUseCase: GetLecturerTitlesUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerTitleRepository,
          useValue: {
            getAll: vi.fn().mockResolvedValue(AppResult.success(paginated)),
          },
        },
        GetLecturerTitlesUseCase,
      ],
    }).compile()

    lecturerTitleRepository = moduleRef.get(LecturerTitleRepository)
    getLecturerTitlesUseCase = moduleRef.get(GetLecturerTitlesUseCase)
  })

  it('should call LecturerTitleRepository.getAll once', async () => {
    const params = new Pagination({})
    await getLecturerTitlesUseCase.execute(params)

    expect(lecturerTitleRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should call LecturerTitleRepository.getAll once with filters', async () => {
    const params = new GetLecturerTitlesParams({
      lecturerId: 'lecturer-id',
      activeOnly: true,
    })
    await getLecturerTitlesUseCase.execute(params)

    expect(lecturerTitleRepository.getAll).toHaveBeenCalledExactlyOnceWith(
      params,
    )
  })

  it('should return success when LecturerTitleRepository.getAll succeeds', async () => {
    const result = await getLecturerTitlesUseCase.execute()

    expect(result).toStrictEqual(AppResult.success(paginated))
  })

  it('should return failed when LecturerTitleRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerTitleRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getLecturerTitlesUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
