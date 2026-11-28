import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Course, CourseType } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'
import { GetCourseByIdUseCase } from './get-course-by-id.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('GetCourseByIdUseCase', () => {
  const course = new Course({
    id: 'course-id',
    code: 'CS101',
    name: 'Data Structures',
    credits: 3,
    semester: 1,
    courseType: CourseType.mandatory,
    programId: 'program-id',
  })
  let courseRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getCourseByIdUseCase: GetCourseByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CourseRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(course)),
          },
        },
        GetCourseByIdUseCase,
      ],
    }).compile()

    courseRepository = moduleRef.get(CourseRepository)
    getCourseByIdUseCase = moduleRef.get(GetCourseByIdUseCase)
  })

  it('should call CourseRepository.getById once', async () => {
    await getCourseByIdUseCase.execute('course-id')

    expect(courseRepository.getById).toHaveBeenCalledExactlyOnceWith(
      'course-id',
    )
  })

  it('should return success with course when CourseRepository.getById succeeds', async () => {
    const result = await getCourseByIdUseCase.execute('course-id')

    expect(result).toStrictEqual(AppResult.success(course))
  })

  it('should return failed with exception when CourseRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(courseRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getCourseByIdUseCase.execute('course-id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
