import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import { GetFacultyByIdUseCase } from './get-faculty-by-id.use-case.js'

describe('GetFacultyByIdUseCase', () => {
  const faculty = new Faculty({
    id: 'id',
    name: 'Faculty of Science',
  })
  let facultyRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getFacultyByIdUseCase: GetFacultyByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FacultyRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(faculty)),
          },
        },
        GetFacultyByIdUseCase,
      ],
    }).compile()

    facultyRepository = moduleRef.get(FacultyRepository)
    getFacultyByIdUseCase = moduleRef.get(GetFacultyByIdUseCase)
  })

  it('should call FacultyRepository.getById once', async () => {
    await getFacultyByIdUseCase.execute('id')

    expect(facultyRepository.getById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success with faculty when FacultyRepository.getById succeeds', async () => {
    const result = await getFacultyByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(faculty))
  })

  it('should return failed with exception when FacultyRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(facultyRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getFacultyByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
