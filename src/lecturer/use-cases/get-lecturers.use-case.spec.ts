import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../entities/lecturer.entity.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import {
  GetLecturersParams,
  GetLecturersUseCase,
} from './get-lecturers.use-case.js'

describe('GetLecturersUseCase', () => {
  const lecturers = Array.from({ length: 5 }, (_, index) => {
    return new Lecturer({
      id: `${index}`,
      name: `Lecturer ${index}`,
      displayName: `Dr. Lecturer ${index}`,
      programId: 'program-id',
      employmentStatus: EmploymentStatus.asn,
      rankId: 'rank-id',
      functionalRankId: null,
      academicDegree: AcademicDegree.doctorate,
    })
  })
  const paginated = new PaginatedResult({
    data: lecturers,
    pagination: new PaginationResult({
      page: 1,
      pageSize: 10,
      total: 5,
    }),
  })
  let lecturerRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getLecturersUseCase: GetLecturersUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerRepository,
          useValue: {
            getAll: vi.fn().mockResolvedValue(AppResult.success(paginated)),
          },
        },
        GetLecturersUseCase,
      ],
    }).compile()

    lecturerRepository = moduleRef.get(LecturerRepository)
    getLecturersUseCase = moduleRef.get(GetLecturersUseCase)
  })

  it('should call LecturerRepository.getAll once', async () => {
    const params = new Pagination({})
    await getLecturersUseCase.execute(params)

    expect(lecturerRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should call LecturerRepository.getAll once with filters', async () => {
    const params = new GetLecturersParams({
      programId: 'program-id',
      employmentStatus: EmploymentStatus.military,
      search: 'Budi',
    })
    await getLecturersUseCase.execute(params)

    expect(lecturerRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with lecturers when LecturerRepository.getAll succeeds', async () => {
    const result = await getLecturersUseCase.execute()

    expect(result).toStrictEqual(AppResult.success(paginated))
  })

  it('should return failed with exception when LecturerRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getLecturersUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
