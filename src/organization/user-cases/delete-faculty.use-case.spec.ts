import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Test } from '@nestjs/testing'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import { DeleteFacultyUseCase } from './delete-faculty.use-case.js'

describe('DeleteFacultyUseCase', () => {
  let facultyRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteFacultyUseCase: DeleteFacultyUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FacultyRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteFacultyUseCase,
      ],
    }).compile()

    facultyRepository = moduleRef.get(FacultyRepository)
    deleteFacultyUseCase = moduleRef.get(DeleteFacultyUseCase)
  })

  it('should calls FacultyRepository.deleteById once', async () => {
    await deleteFacultyUseCase.execute('id')

    expect(facultyRepository.deleteById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success with correct faculty when FacultyRepository.deleteById success', async () => {
    const result = await deleteFacultyUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with correct exception when FacultyRepository.deleteById failed', async () => {
    const e = AppException.test()
    vi.spyOn(facultyRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteFacultyUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
