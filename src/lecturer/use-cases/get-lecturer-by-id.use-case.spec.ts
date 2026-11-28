import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../entities/lecturer.entity.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import { GetLecturerByIdUseCase } from './get-lecturer-by-id.use-case.js'

describe('GetLecturerByIdUseCase', () => {
  const lecturer = new Lecturer({
    id: 'id',
    name: 'Budi Santoso',
    displayName: 'Dr. Budi Santoso, S.T., M.T.',
    programId: 'program-id',
    employmentStatus: EmploymentStatus.asn,
    rankId: 'rank-id',
    functionalRankId: 'functional-rank-id',
    academicDegree: AcademicDegree.doctorate,
  })
  let lecturerRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getLecturerByIdUseCase: GetLecturerByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
          },
        },
        GetLecturerByIdUseCase,
      ],
    }).compile()

    lecturerRepository = moduleRef.get(LecturerRepository)
    getLecturerByIdUseCase = moduleRef.get(GetLecturerByIdUseCase)
  })

  it('should call LecturerRepository.getById once', async () => {
    await getLecturerByIdUseCase.execute('id')

    expect(lecturerRepository.getById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success with lecturer when LecturerRepository.getById succeeds', async () => {
    const result = await getLecturerByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(lecturer))
  })

  it('should return failed with exception when LecturerRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getLecturerByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
