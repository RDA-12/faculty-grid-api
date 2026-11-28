import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import { GetLecturerTitleByIdUseCase } from './get-lecturer-title-by-id.use-case.js'

describe('GetLecturerTitleByIdUseCase', () => {
  const assignment = new LecturerTitle({
    id: 'id',
    lecturerId: 'lecturer-id',
    titleId: 'title-id',
    facultyId: 'faculty-id',
    programId: null,
    startDate: '2026-01-01',
    endDate: null,
  })
  let lecturerTitleRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getLecturerTitleByIdUseCase: GetLecturerTitleByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerTitleRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(assignment)),
          },
        },
        GetLecturerTitleByIdUseCase,
      ],
    }).compile()

    lecturerTitleRepository = moduleRef.get(LecturerTitleRepository)
    getLecturerTitleByIdUseCase = moduleRef.get(GetLecturerTitleByIdUseCase)
  })

  it('should call LecturerTitleRepository.getById once', async () => {
    await getLecturerTitleByIdUseCase.execute('id')

    expect(lecturerTitleRepository.getById).toHaveBeenCalledExactlyOnceWith(
      'id',
    )
  })

  it('should return success when LecturerTitleRepository.getById succeeds', async () => {
    const result = await getLecturerTitleByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(assignment))
  })

  it('should return failed when LecturerTitleRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerTitleRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getLecturerTitleByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
