import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { CourseRepository } from '../repositories/course.repository.js'
import { DeleteCourseUseCase } from './delete-course.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('DeleteCourseUseCase', () => {
  let courseRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteCourseUseCase: DeleteCourseUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CourseRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteCourseUseCase,
      ],
    }).compile()

    courseRepository = moduleRef.get(CourseRepository)
    deleteCourseUseCase = moduleRef.get(DeleteCourseUseCase)
  })

  it('should call CourseRepository.deleteById once', async () => {
    await deleteCourseUseCase.execute('course-id')

    expect(courseRepository.deleteById).toHaveBeenCalledExactlyOnceWith(
      'course-id',
    )
  })

  it('should return success with null when CourseRepository.deleteById succeeds', async () => {
    const result = await deleteCourseUseCase.execute('course-id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with exception when CourseRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(courseRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteCourseUseCase.execute('course-id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
