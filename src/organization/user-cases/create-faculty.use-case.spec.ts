import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Test } from '@nestjs/testing'
import { Faculty } from '../entities/faculty.entity.js'
import {
  CreateFacultyParams,
  CreateFacultyUseCase,
} from './create-faculty.use-case.js'
import { FacultyRepository } from '../repositories/faculty.repository.js'
import { User } from '../../user/entities/user.entity.js'

describe('CreateFacultyUseCase', () => {
  const user = new User({
    id: 'id',
    email: 'email',
    name: 'name',
  })
  const params = new CreateFacultyParams({ name: 'name', user })
  const faculty = new Faculty({
    id: 'id',
    name: params.name,
  })
  let facultyRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let createFacultyUseCase: CreateFacultyUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: FacultyRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(faculty)),
          },
        },
        CreateFacultyUseCase,
      ],
    }).compile()

    facultyRepository = moduleRef.get(FacultyRepository)
    createFacultyUseCase = moduleRef.get(CreateFacultyUseCase)
  })

  it('should calls FacultyRepository.save once', async () => {
    await createFacultyUseCase.execute(params)

    expect(facultyRepository.save).toHaveBeenCalledExactlyOnceWith(
      params.name,
      user.id,
    )
  })

  it('should return success with correct faculty when FacultyRepository.save success', async () => {
    const result = await createFacultyUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(faculty))
  })

  it('should return failed with correct exception when FacultyRepository.save failed', async () => {
    const e = AppException.test()
    vi.spyOn(facultyRepository, 'save').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await createFacultyUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
