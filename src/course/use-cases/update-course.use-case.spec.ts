import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Course, CourseType } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'
import {
  UpdateCourseParams,
  UpdateCourseUseCase,
} from './update-course.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('UpdateCourseUseCase', () => {
  const params = new UpdateCourseParams({
    id: 'course-id',
    code: 'CS102',
    name: 'Algorithms',
    credits: 4,
    semester: 2,
    courseType: CourseType.elective,
    programId: 'program-id',
  })
  const course = new Course({
    id: params.id,
    code: params.code,
    name: params.name,
    credits: params.credits,
    semester: params.semester,
    courseType: params.courseType,
    programId: params.programId,
  })
  let courseRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let updateCourseUseCase: UpdateCourseUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CourseRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(course)),
          },
        },
        UpdateCourseUseCase,
      ],
    }).compile()

    courseRepository = moduleRef.get(CourseRepository)
    updateCourseUseCase = moduleRef.get(UpdateCourseUseCase)
  })

  it('should call CourseRepository.update once', async () => {
    await updateCourseUseCase.execute(params)

    expect(courseRepository.update).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with course when CourseRepository.update succeeds', async () => {
    const result = await updateCourseUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(course))
  })

  it('should return failed with exception when CourseRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(courseRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await updateCourseUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
