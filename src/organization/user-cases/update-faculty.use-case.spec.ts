import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Faculty } from '../entities/faculty.entity.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import {
  UpdateFacultyParams,
  UpdateFacultyUseCase,
} from './update-faculty.use-case.js'

describe('UpdateFacultyUseCase', () => {
  const params = new UpdateFacultyParams({
    id: 'id',
    name: 'Faculty of Engineering',
  })
  const faculty = new Faculty({
    id: params.id,
    name: params.name,
  })
  let facultyRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let updateFacultyUseCase: UpdateFacultyUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FacultyRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(faculty)),
          },
        },
        UpdateFacultyUseCase,
      ],
    }).compile()

    facultyRepository = moduleRef.get(FacultyRepository)
    updateFacultyUseCase = moduleRef.get(UpdateFacultyUseCase)
  })

  it('should call FacultyRepository.update once', async () => {
    await updateFacultyUseCase.execute(params)

    expect(facultyRepository.update).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with updated faculty when FacultyRepository.update succeeds', async () => {
    const result = await updateFacultyUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(faculty))
  })

  it('should return failed with exception when FacultyRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(facultyRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await updateFacultyUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
